from typing import Annotated

from starlette import status

from app.db.connect import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.schema.chat import ChatResponse, ChatRequest, ChatUpdateRequest
from app.db.model.chat import Chat

router= APIRouter(prefix="/chat", tags=["chat"])

@router.post("/create_chat", response_model=ChatResponse)
async def create_chat(request: ChatRequest, db: Annotated[Session, Depends(get_db)]):
    chat= Chat(chat_title= "New Chat", user_id= request.user_id)
    if chat is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

@router.get("/get_chat/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: int, db: Annotated[Session, Depends(get_db)]):
    stmt= select(Chat).where(Chat.id==chat_id)
    chat= db.execute(stmt).scalar()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat

@router.get("/get_chats/{user_id}", response_model=list[ChatResponse])
async def get_chats(user_id: int, db: Annotated[Session, Depends(get_db)]):
    stmt= select(Chat).where(Chat.user_id==user_id)
    chats= db.execute(stmt).scalars().all()
    return chats

@router.put("/update_chat/{chat_id}", response_model=ChatResponse)
async def update_chat_title(chat_id: int, request: ChatUpdateRequest, db: Annotated[Session, Depends(get_db)]):
    stmt= select(Chat).where(Chat.id==chat_id)
    chat= db.execute(stmt).scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    chat.chat_title= request.chat_title
    db.commit()
    db.refresh(chat)
    return chat

@router.delete("/delete_chat/{chat_id}")
async def delete_chat(chat_id: int, db: Annotated[Session, Depends(get_db)]):
    stmt= select(Chat).where(Chat.id==chat_id)
    chat= db.execute(stmt).scalar_one_or_none()
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    db.delete(chat)
    db.commit()
    return {"detail": "Chat deleted successfully"}
