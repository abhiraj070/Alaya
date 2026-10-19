import asyncio
import json
from uuid import uuid4
from pathlib import Path
from typing import Annotated

from starlette.requests import Request
from arq import ArqRedis
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import JSONResponse, Response, StreamingResponse
from app.auth.VerifyJWT import VerifyJWT
from app.core_tasks.llm_calls.prompts import (
    send_prompt_to_normalize, decide_retrieval_strategy,
    send_prompt_to_plan, send_prompt_for_response,
)
from app.core_tasks.llm_setup.embeddings_llm import get_embedding
from app.core_tasks.arq_worker.get_queue import get_queue
from app.core_tasks.search.retrieval import retrieve_queries
from app.db.connect import get_db
from app.db.model.chat import Chat, Message, Embedding, Sender
from app.db.model.uploaded_data import UploadedData, DataType
from app.schema.messages import MessageResponse, MessageRequest, MessageUpdateRequest
from cloudinary.exceptions import Error as CloudinaryError

from app.utility.cloudinary import delete_file, upload_file

router = APIRouter(prefix="/messages", tags=["messages"])

TEMP_IMAGE_DIR = Path(__file__).resolve().parents[2] / "temp_img"
TEMP_FILE_DIR = Path(__file__).resolve().parents[2] / "temp_files"
MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
UPLOAD_CHUNK_SIZE_BYTES = 64 * 1024
SUPPORTED_IMAGE_SIGNATURES = (
    b"\x89PNG\r\n\x1a\n",
    b"\xff\xd8\xff",
)

async def stream_default_response(user_query: str, chat_id: int, db: Session):
    cleaned = user_query.strip()
    if cleaned.lower() in ("hi", "hello", "hey", "yo", "sup"):
        greeting = f"Hey there! I received your greeting: \"{cleaned}\"."
    else:
        greeting = f"I received your message: \"{cleaned}\"."

    default_text = (
        f"{greeting}\n\n"
        "*(The live AI response is unavailable because a request or retrieval step failed. Please try again.)*"
    )

    words = default_text.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        yield chunk
        await asyncio.sleep(0.015)

    chat = db.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if chat:
        chat.updated_at = func.now()

def send_direct_response(text: str, chat_id: int, user_id: int, db: Session):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Direct response cannot be empty")
    db.add(Message(chat_id=chat_id, message_content=text, sent_by=Sender.LLM, user_id=user_id))
    chat = db.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if chat:
        chat.updated_at = func.now()
    db.commit()
    return Response(content=text, media_type="text/plain")


async def build_message_response(response_stream, usage: dict | None):
    if usage is None:
        return StreamingResponse(response_stream, media_type="text/plain")
    text= "".join([chunk async for chunk in response_stream])
    return JSONResponse({"response": text, "usage": usage or None})


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
                            include_usage: bool = False,
):
    usage= {} if include_usage else None
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
        embeddable_query = await send_prompt_to_normalize(message.message_content, usage=usage)
        normalized_data = json.loads(embeddable_query)
        if not isinstance(normalized_data["is_embedding"], bool):
            raise ValueError("is_embedding must be a boolean")
        if normalized_data["is_embedding"] is False:
            response= send_direct_response(normalized_data["direct_response"], chat_id, user_id, db)
            return JSONResponse({"response": normalized_data["direct_response"], "usage": usage}) if include_usage else response
        embeddable_queries = normalized_data["queries"]

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

        return await build_message_response(
            send_prompt_for_response(search_results, chat_id, user_id, db, usage=usage), usage,
        )
    except Exception as exc:
        print(f"[OpenAI pipeline fallback: {exc}] - Streaming default answer.")
        if usage is not None:
            usage.clear()
        return await build_message_response(
            stream_default_response(message.message_content, chat_id, db), usage,
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
        normalized_data = json.loads(embeddable_query)
        if not isinstance(normalized_data["is_embedding"], bool):
            raise ValueError("is_embedding must be a boolean")
        if normalized_data["is_embedding"] is False:
            return send_direct_response(normalized_data["direct_response"], chat_id, user_id, db)
        embeddable_queries = normalized_data["queries"]

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
            stream_default_response(new_message, chat_id, db),
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
        await queue.enqueue_job("create_knowledge_embedding", text_content, user_id, uploaded_data.id)
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
