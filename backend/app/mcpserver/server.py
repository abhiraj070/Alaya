import codecs
import json
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path
from typing import Any

from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from starlette.requests import Request
from starlette.responses import StreamingResponse

from app.api.messages import feed_knowledge, file_upload, handle_new_message, image_upload
from app.api.uploaded_data import delete_upload, get_uploads
from app.api.user import update_user_helper
from app.auth.VerifyJWT import decode_access_token_claims, verify_token_session
from app.core_tasks.arq_worker.arqRedis_init import create_redis_pool
from app.db.connect import SessionLocal
from app.db.model import universe  # noqa: F401 -- register KnowledgeCoordinate for ORM relationships
from app.schema.user import AuthResponse
from app.db.model.chat import Chat
from app.db.model.user import User
from app.schema.messages import MessageRequest
from app.schema.uploaded_data import UploadedDataResponse
from app.utility.phone_number import normalize_phone_number

mcp= MCPServer("Alaya")


@contextmanager
def user_session(access_token: str):
    try:
        claims = decode_access_token_claims(access_token)
    except HTTPException as exc:
        raise ToolError(str(exc.detail)) from exc
    phone_number = claims.get("phone_number")
    if not isinstance(phone_number, str) or not phone_number.strip():
        raise ToolError("Access token has no phone number; add a phone number to your account and sign in again")
    try:
        phone_number = normalize_phone_number(phone_number)
    except ValueError as exc:
        raise ToolError("Access token contains an invalid phone number; sign in again") from exc
    with SessionLocal() as db:
        user = db.execute(select(User).where(User.phone_number == phone_number)).scalar_one_or_none()
        if user is None:
            raise ToolError("User not found")
        if user.id != claims["user_id"]:
            raise ToolError("Token no longer matches this account; sign in again")
        try:
            verify_token_session(claims, user)
            yield db, user.id
        except HTTPException as exc:
            raise ToolError(str(exc.detail)) from exc


@asynccontextmanager
async def knowledge_queue():
    queue = await create_redis_pool()
    try:
        yield queue
    finally:
        await queue.aclose()


@contextmanager
def local_upload(file_path: str):
    path = Path(file_path).expanduser()
    try:
        handle = path.open("rb")
    except OSError as exc:
        raise ToolError("Cannot open the local file; provide a readable file path on the MCP server") from exc
    with handle:
        yield UploadFile(file=handle, filename=path.name)


@mcp.tool()
def update_user_settings(access_token: str, name: str = "", username: str = "") -> AuthResponse:
    """Update the name or username of the account authenticated by the access JWT."""
    with user_session(access_token) as (db, user_id):
        user = update_user_helper(db, name, username, user_id=user_id)
        return AuthResponse(id=user.id, name=user.name, username=user.username)


@mcp.tool()
async def get_uploaded_data(access_token: str) -> list[UploadedDataResponse]:
    """List uploaded text, images, and documents for the account authenticated by the access JWT."""
    with user_session(access_token) as (db, user_id):
        uploads = await get_uploads(user_id=user_id, db=db, authenticated_user_id=user_id)
        return [UploadedDataResponse.model_validate(upload) for upload in uploads]


@mcp.tool()
async def delete_uploaded_data(access_token: str, upload_id: int) -> dict[str, str]:
    """Delete one uploaded item and its associated knowledge belonging to the specified user."""
    with user_session(access_token) as (db, user_id):
        return await delete_upload(upload_id=upload_id, db=db, authenticated_user_id=user_id)


@mcp.tool()
async def ask_alaya(access_token: str, question: str, chat_id: int | None = None, exact_chunks: bool = False) -> dict[str, Any]:
    """Ask Alaya a question, or set exact_chunks=true to return original retrieval data without paraphrasing."""
    if not question.strip():
        raise ToolError("Question cannot be blank")
    with user_session(access_token) as (db, user_id):
        if chat_id is None:
            conversation = Chat(user_id=user_id, chat_title=question.strip()[:80])
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            chat_id = conversation.id
        response = await handle_new_message(
            chat_id=chat_id, message=MessageRequest(message_content=question, user_id=user_id),
            user_id=user_id, db=db, include_usage=False, exact_chunks=exact_chunks,
        )
        if exact_chunks and response.media_type != "application/json":
            raise ToolError("Exact knowledge retrieval did not return a structured result")
        if isinstance(response, StreamingResponse):
            decoder = codecs.getincrementaldecoder("utf-8")()
            chunks = []
            async for chunk in response.body_iterator:
                chunks.append(decoder.decode(chunk) if isinstance(chunk, bytes) else chunk)
            chunks.append(decoder.decode(b"", final=True))
            answer = "".join(chunks)
        elif response.media_type == "application/json":
            payload = json.loads(response.body)
            if exact_chunks:
                return {"chat_id": chat_id, "response": payload["response"], "retrieved_chunks": payload["retrieved_chunks"]}
            answer = payload["response"]
        else:
            answer = response.body.decode(response.charset)
        return {"chat_id": chat_id, "response": answer}


@mcp.tool()
async def store_text_in_alaya(access_token: str, text_content: str, tag: str | None = None) -> dict[str, str]:
    """Store text in Alaya and queue it for knowledge processing with an optional tag."""
    if not text_content.strip():
        raise ToolError("Text cannot be blank")
    with user_session(access_token) as (db, user_id):
        async with knowledge_queue() as queue:
            return await feed_knowledge(
                request=Request({"type": "http"}), user_id=user_id, text_content=text_content,
                queue=queue, db=db, tag=tag,
            )


@mcp.tool()
async def store_image_in_alaya(access_token: str, file_path: str) -> dict[str, str]:
    """Upload a local PNG, JPEG, or WEBP image up to 2 MB and queue it for Alaya knowledge processing."""
    with user_session(access_token) as (db, user_id), local_upload(file_path) as file:
        async with knowledge_queue() as queue:
            return await image_upload(file=file, user_id=user_id, queue=queue, db=db)


@mcp.tool()
async def store_docs_in_alaya(access_token: str, file_path: str) -> dict[str, str]:
    """Upload a local document and queue it for extraction and knowledge processing in Alaya."""
    with user_session(access_token) as (db, user_id), local_upload(file_path) as file:
        async with knowledge_queue() as queue:
            return await file_upload(file=file, user_id=user_id, queue=queue, db=db)


@mcp.prompt()
def get_alaya_knowledge_prompt(access_token: str, question: str, chat_id: str = "") -> str:
    """Use when Argon needs exact information from Alaya without even slight modification."""
    if not access_token.strip() or not question.strip():
        raise ValueError("Access token and question are required")
    arguments = {"access_token": access_token.strip(), "question": question, "exact_chunks": True}
    if chat_id.strip():
        try:
            parsed_chat_id = int(chat_id)
        except ValueError as exc:
            raise ValueError("Chat ID must be a positive integer") from exc
        if parsed_chat_id <= 0:
            raise ValueError("Chat ID must be a positive integer")
        arguments["chat_id"] = parsed_chat_id
    return (
        "Call ask_alaya with these arguments:\n"
        f"{json.dumps(arguments, ensure_ascii=False)}\n"
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")

