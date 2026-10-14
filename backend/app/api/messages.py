import asyncio
from datetime import date
import json
from uuid import uuid4
from pathlib import Path
from typing import Annotated, Any

from starlette.requests import Request
from typesafe_sdk import AsyncTypeSafeClient, Choice
from arq import ArqRedis
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import StreamingResponse
from app.auth.VerifyJWT import VerifyJWT
from app.core_tasks.llm_setup.chat_llm import client, MODEL, VISION_MODEL
from app.core_tasks.llm_setup.embeddings_llm import get_embedding
from app.core_tasks.arq_worker.get_queue import get_queue
from app.core_tasks.search.retrieval import retrieve_queries
from app.db.connect import get_db
from app.db.model.chat import Chat, Message, Embedding, Sender
from app.db.model.uploaded_data import UploadedData, DataType
from app.env_config.settings import get_settings
from app.schema.messages import MessageResponse, MessageRequest, MessageUpdateRequest
from cloudinary.exceptions import Error as CloudinaryError

from app.utility.cloudinary import delete_file, upload_file

router = APIRouter(prefix="/messages", tags=["messages"])

settings = get_settings()


TEMP_IMAGE_DIR = Path(__file__).resolve().parents[2] / "temp_img"
TEMP_FILE_DIR = Path(__file__).resolve().parents[2] / "temp_files"
MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
UPLOAD_CHUNK_SIZE_BYTES = 64 * 1024
SUPPORTED_IMAGE_SIGNATURES = (
    b"\x89PNG\r\n\x1a\n",
    b"\xff\xd8\xff",
)

normalization_prompt= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "normalization_prompt.md").read_text(encoding="utf-8")
structure_knowledge= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "structure_knowledge_metadeta.md").read_text(encoding="utf-8")
criteria= json.loads((Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "criteria_decision.md").read_text(encoding="utf-8"))
instruction= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "instruction_decision.md").read_text(encoding="utf-8")
sql_retrieval_prompt= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "sql_retrieval.md").read_text(encoding="utf-8")
response_prompt= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "response_prompt.md").read_text(encoding="utf-8")
image_read_prompt=(Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "read_image.md").read_text(encoding="utf-8")

async def send_prompt_to_normalize(user_query: str) -> str:
    current_date= date.today().isoformat()
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"{normalization_prompt}\nCurrent date: {current_date}"},
            {"role": "user", "content": user_query},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content

async def send_prompt_to_standardise(user_queries: list[str]) -> str:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"{structure_knowledge}"},
            {"role": "user", "content": json.dumps(user_queries)},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content

async def send_prompt_to_read_image(image_url: str) -> str:
    response = await client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "system",
                "content": image_read_prompt,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url,
                        },
                    },
                ],
            },
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content




async def decide_retrieval_strategy(user_queries: list[str]) -> list[str]:
    strategies: list[str] = []

    async with AsyncTypeSafeClient(api_key=settings.TYPESAFE_API_KEY) as jev_client:
        for query in user_queries:
            response = await jev_client.system_one(
                state={"query": query},
                questions={
                    "retrieval_strategy": Choice(
                        instructions=instruction,
                        criteria=criteria,
                    )
                },
            )
            strategies.append(
                response.answers["retrieval_strategy"].choice
            )

    return strategies


async def send_prompt_to_plan(user_query: str, schema: dict) -> dict:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": sql_retrieval_prompt},
            {"role": "user", "content": json.dumps({"query": user_query, "schema": schema})},
        ],
        max_tokens=1024,
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)

async def send_prompt_for_response(data: list[dict[str,Any]], chat_id: int, user_id: int, db: Session):
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": response_prompt},
            {"role": "user", "content": json.dumps(data)},
        ],
        max_tokens=1024,
        temperature=0.2,
        stream=True
    )
    full_response=""
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            full_response+=content
            yield content

    if full_response != "":
        db_message = Message(
            chat_id=chat_id,
            message_content=full_response,
            sent_by=Sender.LLM,
            user_id=user_id,
        )
        db.add(db_message)
        chat = db.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
        if chat:
            chat.updated_at = func.now()
        db.commit()

async def stream_default_response(user_query: str, chat_id: int, user_id: int, db: Session):
    cleaned = user_query.strip()
    if cleaned.lower() in ("hi", "hello", "hey", "yo", "sup"):
        greeting = f"Hey there! I received your greeting: \"{cleaned}\"."
    else:
        greeting = f"I received your message: \"{cleaned}\"."

    default_text = (
        f"{greeting}\n\n"
        "*(Note: OpenAI API credits are currently exhausted. This is a default response so you can test sending, editing, and deleting messages. Once OpenAI credits are refilled, live AI responses with retrieval will resume!)*"
    )

    words = default_text.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        yield chunk
        await asyncio.sleep(0.015)

    db_message = Message(
        chat_id=chat_id,
        message_content=default_text,
        sent_by=Sender.LLM,
        user_id=user_id,
    )
    db.add(db_message)
    chat = db.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if chat:
        chat.updated_at = func.now()
    db.commit()

def is_supported_image(file_path: Path) -> bool:
    with file_path.open("rb") as image_file:
        header = image_file.read(12)

    return header.startswith(SUPPORTED_IMAGE_SIGNATURES) or (
        header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    )



@router.post("/new_messages/{chat_id}")
async def handle_new_message(chat_id: int,
                            message: MessageRequest,
                            user_id: Annotated[int, Depends(VerifyJWT)],
                            db: Annotated[Session, Depends(get_db)],
):
    chat = db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
    ).scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    # Persist user message in DB first
    db_message = Message(
        chat_id=chat_id,
        message_content=message.message_content,
        sent_by=Sender.USER,
        user_id=user_id,
    )
    chat.updated_at = func.now()
    db.add(db_message)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Message could not be stored")

    # Attempt live OpenAI normalization, embeddings, and retrieval
    try:
        embeddable_query = await send_prompt_to_normalize(message.message_content)
        embeddable_queries = json.loads(embeddable_query)["queries"]

        embeddings = await get_embedding(embeddable_queries)
        for embedding in embeddings:
            db_embeddings = Embedding(
                message_id=db_message.id,
                vector=embedding["vector"],
                kind="MESSAGE",
                embedded_text=embedding["subquery"],
            )
            db.add(db_embeddings)
        db.commit()

        decisions = await decide_retrieval_strategy(embeddable_queries)
        search_results = await retrieve_queries(
            db, user_id, embeddable_queries, decisions,
            embeddings, db_message.id, send_prompt_to_plan,
        )

        return StreamingResponse(
            send_prompt_for_response(search_results, chat_id, user_id, db),
            media_type="text/plain",
        )
    except Exception as exc:
        print(f"[OpenAI pipeline fallback: {exc}] - Streaming default answer.")
        return StreamingResponse(
            stream_default_response(message.message_content, chat_id, user_id, db),
            media_type="text/plain",
        )

@router.get("/get_messages/{chat_id}", response_model=list[MessageResponse])
async def get_messages(chat_id: int, db: Annotated[Session, Depends(get_db)],
                       user_id: Annotated[int, Depends(VerifyJWT)]):
    chat = db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
    ).scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    stmt= select(Message).where(Message.chat_id==chat_id).order_by(Message.created_at.asc())
    messages= db.execute(stmt).scalars().all()
    return messages

@router.put("/update_message/{chat_id}/{message_id}")
async def update_message(chat_id: int,
                         message_id: int,
                         request: MessageUpdateRequest,
                         db: Annotated[Session, Depends(get_db)],
                         user_id: Annotated[int, Depends(VerifyJWT)],
):
    stmt = select(Message).join(Chat).where(
        Message.id == message_id,
        Message.chat_id == chat_id,
        Message.user_id == user_id,
        Chat.user_id == user_id,
    )
    message= db.execute(stmt).scalar_one_or_none()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    new_message = request.message_content
    # Update message content in DB first
    message.message_content = new_message
    message.embeddings.clear()
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Message could not be stored")

    # Attempt live OpenAI normalization, embeddings, and retrieval
    try:
        embeddable_query = await send_prompt_to_normalize(new_message)
        embeddable_queries = json.loads(embeddable_query)["queries"]

        embeddings = await get_embedding(embeddable_queries)
        for embedding in embeddings:
            db_embeddings = Embedding(
                message_id=message.id,
                vector=embedding["vector"],
                kind="MESSAGE",
                embedded_text=embedding["subquery"],
            )
            db.add(db_embeddings)
        db.commit()

        decisions = await decide_retrieval_strategy(embeddable_queries)
        search_results = await retrieve_queries(
            db, user_id, embeddable_queries, decisions,
            embeddings, message.id, send_prompt_to_plan,
        )

        return StreamingResponse(
            send_prompt_for_response(search_results, chat_id, user_id, db),
            media_type="text/plain",
        )
    except Exception as exc:
        print(f"[OpenAI pipeline update fallback: {exc}] - Streaming default answer.")
        return StreamingResponse(
            stream_default_response(new_message, chat_id, user_id, db),
            media_type="text/plain",
        )

@router.delete("/delete_message/{message_id}")
async def delete_message(message_id: int, db: Annotated[Session, Depends(get_db)],
                         user_id: Annotated[int, Depends(VerifyJWT)]):
    stmt = select(Message).join(Chat).where(
        Message.id == message_id,
        Message.user_id == user_id,
        Chat.user_id == user_id,
    )
    message= db.execute(stmt).scalar_one_or_none()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    db.delete(message)
    db.commit()
    return {"detail": "Message deleted successfully"}

@router.post("/feed_knowledge")
async def feed_knowledge(
        request: Request,
        user_id: Annotated[int, Depends(VerifyJWT)],
        text_content: str,
        queue: Annotated[ArqRedis, Depends(get_queue)],
        db: Annotated[Session, Depends(get_db)],
        tag: str | None = None,
):
    if text_content.strip() == "":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be spaces or blank")

    uploaded_data = UploadedData(
        data_type=DataType.TEXT,
        tag=tag,
        data_source=text_content,
        user_id=user_id,
    )
    db.add(uploaded_data)
    db.commit()
    try:
        await queue.enqueue_job("create_knowledge_embedding", text_content, user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="File upload failed")
    return {"message": "Knowledge queued for processing"}


@router.post("/image_upload")
async def image_upload(
    file: Annotated[UploadFile, File(...)],
    user_id: Annotated[int, Depends(VerifyJWT)],
    queue: Annotated[ArqRedis, Depends(get_queue)],
    db: Annotated[Session, Depends(get_db)],
):
    original_filename = Path(file.filename or "upload").name
    temporary_path = TEMP_IMAGE_DIR / f"{uuid4().hex}{Path(original_filename).suffix}"

    try:
        TEMP_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        with temporary_path.open("wb") as local_file:
            bytes_written = 0
            while chunk := file.file.read(UPLOAD_CHUNK_SIZE_BYTES):
                bytes_written += len(chunk)
                if bytes_written > MAX_IMAGE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="Image must not exceed 2 MB",
                    )
                local_file.write(chunk)

        if not is_supported_image(temporary_path):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PNG, JPEG, and WEBP images are supported",
            )

        upload_result = upload_file(temporary_path, original_filename)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File could not be stored locally",
        ) from exc
    except CloudinaryError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="File upload failed",
        ) from exc
    finally:
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            pass
    format_tag = (upload_result.get("format") or Path(original_filename).suffix.lstrip(".")).lower()
    uploaded_data = UploadedData(
        data_type=DataType.IMG,
        tag=format_tag,
        data_source=upload_result["secure_url"],
        user_id=user_id,
    )
    db.add(uploaded_data)
    db.commit()

    try:
        cloudinary_data = {
            "secure_url": upload_result["secure_url"],
            "public_id": upload_result["public_id"],
            "resource_type": upload_result.get("resource_type", "image"),
        }
        await queue.enqueue_job("create_image_embeddings", user_id, cloudinary_data, uploaded_data.id)
    except Exception:
        try:
            delete_file(
                upload_result["public_id"],
                upload_result.get("resource_type", "image"),
            )
        except CloudinaryError:
            pass
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="File upload failed")

    return {"message": "Image queued for processing"}

@router.post(
    "/file_upload",
    status_code=status.HTTP_201_CREATED)
async def file_upload(
        file: Annotated[UploadFile, File(...)],
        user_id: Annotated[int, Depends(VerifyJWT)],
        queue: Annotated[ArqRedis, Depends(get_queue)],
        db: Annotated[Session, Depends(get_db)],
):
    original_filename= Path(file.filename or "upload").name
    temporary_path= TEMP_FILE_DIR / f"{uuid4().hex}{Path(original_filename).suffix}"
    try:
        TEMP_FILE_DIR.mkdir(parents=True, exist_ok=True)
        with temporary_path.open("wb") as local_file:
            while chunk := await file.read(UPLOAD_CHUNK_SIZE_BYTES):
                local_file.write(chunk)
        upload_result = upload_file(temporary_path, original_filename)
        format_tag = (upload_result.get("format") or Path(original_filename).suffix.lstrip(".")).lower()
        uploaded_data = UploadedData(
            data_type=DataType.DOCS,
            tag=format_tag,
            data_source=upload_result["secure_url"],
            user_id=user_id,
        )
        db.add(uploaded_data)
        db.commit()

        await queue.enqueue_job("create_file_embeddings", str(temporary_path), user_id, uploaded_data.id)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="File upload failed")

    return {"message": "File queued for processing"}
