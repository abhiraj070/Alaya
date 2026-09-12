from typing import Annotated

from arq.connections import ArqRedis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status

from app.db.connect import get_db
from app.db.model.chat import Message
from app.core_tasks.queue import get_queue
from app.schema.messages import MessageResponse, MessageRequest, MessageUpdateRequest

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/new_messages/{chat_id}", response_model=MessageResponse)
async def store_new_message(chat_id: int,
                            message: MessageRequest,
                            db: Annotated[Session, Depends(get_db)],
                            queue: Annotated[ArqRedis, Depends(get_queue)]
):
    db_message = Message(chat_id=chat_id,
                      message_content=message.message_content,
                      sent_by="USER",
                      user_id=message.user_id
    )
    try:
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Message could not be stored")
    await queue.enqueue_job("create_message_embedding", db_message.id)
    return db_message

# @router.get("/get_message/{message_id}", response_model=MessageResponse)
# async def get_message(message_id: int, db: Annotated[Session, Depends(get_db)]):
#     stmt= select(Message).where(Message.id==message_id)
#     message= db.execute(stmt).scalar_one_or_none()
#     if message is None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
#     return message

@router.get("/get_messages/{chat_id}", response_model=list[MessageResponse])
async def get_messages(chat_id: int, db: Annotated[Session, Depends(get_db)]):
    stmt= select(Message).where(Message.chat_id==chat_id)
    messages= db.execute(stmt).scalars().all()
    return messages

@router.put("/update_message/{message_id}", response_model=MessageResponse)
async def update_message(message_id: int, request: MessageUpdateRequest,
                         db: Annotated[Session, Depends(get_db)]
):
    stmt= select(Message).where(Message.id==message_id)
    message= db.execute(stmt).scalar_one_or_none()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    message.message_content= request.message_content
    db.commit()
    db.refresh(message)
    return message

@router.delete("/delete_message/{message_id}")
async def delete_message(message_id: int, db: Annotated[Session, Depends(get_db)]):
    stmt= select(Message).where(Message.id==message_id)
    message= db.execute(stmt).scalar_one_or_none()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    db.delete(message)
    db.commit()
    return {"detail": "Message deleted successfully"}
