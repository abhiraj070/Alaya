from typing import Annotated

from starlette import status

from app.db.connect import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core_tasks.llm_setup.chat_llm import client, MODEL, get_completion_options
from app.schema.chat import ChatResponse, ChatRequest, ChatUpdateRequest
from app.db.model.chat import Chat
from app.auth.VerifyJWT import VerifyJWT

router= APIRouter(prefix="/chat", tags=["chat"])

@router.post("/create_chat", response_model=ChatResponse)
async def create_chat(request: ChatRequest, db: Annotated[Session, Depends(get_db)],
                      authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    if request.user_id != authenticated_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    chat= Chat(chat_title= request.chat_title or "New Chat", user_id= request.user_id)
    if chat is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal Server Error"
        )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

@router.get("/get_chats/{user_id}", response_model=list[ChatResponse])
async def get_chats(user_id: int, db: Annotated[Session, Depends(get_db)],
                    authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    if user_id != authenticated_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    stmt = select(Chat).where(Chat.user_id == user_id).order_by(Chat.updated_at.desc(), Chat.id.desc())
    chats = db.execute(stmt).scalars().all()
    return chats

@router.get("/get_chat/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: int, db: Annotated[Session, Depends(get_db)],
                   authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    stmt = select(Chat).where(Chat.id == chat_id, Chat.user_id == authenticated_user_id)
    chat = db.execute(stmt).scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat

@router.put("/update_chat/{chat_id}", response_model=ChatResponse)
async def update_chat_title(chat_id: int, request: ChatUpdateRequest,
                            db: Annotated[Session, Depends(get_db)],
                            authenticated_user_id: Annotated[int, Depends(VerifyJWT)]
):
    stmt= select(Chat).where(Chat.id==chat_id, Chat.user_id==authenticated_user_id)
    chat= db.execute(stmt).scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if request.chat_title is not None:
        chat.chat_title= request.chat_title
        db.commit()
        db.refresh(chat)
        return chat
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "Generate a short, descriptive title based on " 
                                          "the user's first message. Return only the title, " 
                                          "without quotation marks or explanations."},
            {"role": "user", "content": request.first_chat}
        ],
        **get_completion_options(MODEL, max_tokens=30),
    )
    title= response.choices[0].message.content.strip().strip('"')
    if not title:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY,detail="Failed to generate chat title")
    chat.chat_title = title
    db.commit()
    db.refresh(chat)
    return chat

@router.delete("/delete_chat/{chat_id}")
async def delete_chat(chat_id: int, db: Annotated[Session, Depends(get_db)],
                      authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    stmt= select(Chat).where(Chat.id==chat_id, Chat.user_id==authenticated_user_id)
    chat= db.execute(stmt).scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    db.delete(chat)
    db.commit()
    return {"detail": "Chat deleted successfully"}

