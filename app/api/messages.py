from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status

from app.db.connect import get_db
from app.db.model.chat import Message
from app.schema.messages import MessageResponse, MessageRequest, MessageUpdateRequest

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/new_messages/{chat_id}", response_model=MessageResponse)
async def store_new_message(chat_id: int, message: MessageRequest, db: Annotated[Session, Depends(get_db)]):
    message = Message(chat_id=chat_id,
                      message_content=message.message_content,
                      sent_by=message.sent_by,
                      user_id=message.user_id
    )
    if message is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Message was not created" )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

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
async def update_message(message_id: int, request: MessageUpdateRequest, db: Annotated[Session, Depends(get_db)]):
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
