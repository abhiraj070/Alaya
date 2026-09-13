from datetime import date
import json
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status

from app.core_tasks.chat_llm import client, MODEL
from app.core_tasks.embeddings import get_embedding
from app.db.connect import get_db
from app.db.model.chat import Message, Embedding
from app.schema.messages import MessageResponse, MessageRequest, MessageUpdateRequest

router = APIRouter(prefix="/messages", tags=["messages"])

normalization_prompt = (Path(__file__).parent.parent / "core_tasks" / "normalization_prompt.md").read_text()

def send_prompt_to_normalize(user_query: str) -> str:
    current_date= date.today().isoformat()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"{normalization_prompt}\nCurrent date: {current_date}"},
            {"role": "user", "content": user_query},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content

@router.post("/new_messages/{chat_id}", response_model=MessageResponse)
async def store_new_message(chat_id: int,
                            message: MessageRequest,
                            db: Annotated[Session, Depends(get_db)],
):
    #normalization
    try:
        embeddable_query= send_prompt_to_normalize(message.message_content)
        embeddable_queries= json.loads(embeddable_query)["queries"]
    except Exception:
        raise HTTPException(status_code=502, detail="Query normalization failed")

    #embeddings creation
    try:
        embeddings = await get_embedding(embeddable_queries)
    except Exception:
        raise HTTPException(status_code=502, detail="Embedding generation failed")

    #data getting saved
    db_message = Message(chat_id=chat_id,
                      message_content=message.message_content,
                      sent_by="USER",
                      user_id=message.user_id
    )
    db.add(db_message)
    try:
        db.flush()
        for embedding in embeddings:
            db_embeddings = Embedding(message_id=db_message.id,
                                      vector=embedding["vector"],
                                      kind="MESSAGE",
                                      embedded_text=embedding["subquery"]
            )
            db.add(db_embeddings)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Message could not be stored")

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
