from typing import Annotated
from app.db.connect import get_db
from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.schema.chat import ChatResponse, ChatRequest
from app.db.model.chat import Chat

router= APIRouter(prefix="/chat", tags=["chat"])

#@router.post("/create_chat", response_model=ChatResponse)
#async def create_chat(request: ChatRequest, db: Annotated[Session, get_db]):