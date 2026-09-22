from datetime import date
import json
from pathlib import Path
from typing import Annotated, Any

from arq import ArqRedis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import StreamingResponse

from app.auth.VerifyJWT import VerifyJWT
from app.core_tasks.chat_llm import client, MODEL
from app.core_tasks.embeddings import get_embedding
from app.core_tasks.queue import get_queue
from app.core_tasks.retrieval import retrieve_queries
from app.db.connect import get_db
from app.db.model.chat import Message, Embedding, Knowledge
from app.schema.messages import MessageResponse, MessageRequest, MessageUpdateRequest

router = APIRouter(prefix="/messages", tags=["messages"])

normalization_prompt= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "normalization_prompt.md").read_text()
structure_knowledge= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "structure_knowledge_metadeta.md").read_text()
decision_prompt= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "decision.md").read_text()
sql_retrieval_prompt= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "sql_retrieval.md").read_text()
response_prompt= (Path(__file__).parent.parent / "core_tasks" / "system_prompts" / "response_prompt.md").read_text()

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

def send_prompt_to_standardise(user_queries: list[str]) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"{structure_knowledge}"},
            {"role": "user", "content": json.dumps(user_queries)},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content

def send_prompt_to_decide(user_queries: list[str]) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"{decision_prompt}"},
            {"role": "user", "content": json.dumps(user_queries)},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content

def send_prompt_to_plan(user_query: str, schema: dict) -> dict:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": sql_retrieval_prompt},
            {"role": "user", "content": json.dumps({"query": user_query, "schema": schema})},
        ],
        max_tokens=1024,
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)

async def send_prompt_for_response(data: list[dict[str,Any]]):
    stream =await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": sql_retrieval_prompt},
            {"role": "user", "content": json.dumps(data)},
        ],
        max_tokens=1024,
        temperature=0.2,
        stream=True
    )
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content


@router.post("/new_messages/{chat_id}")
async def handle_new_message(chat_id: int,
                            message: MessageRequest,
                            user_id: Annotated[int, Depends(VerifyJWT)],
                            db: Annotated[Session, Depends(get_db)],
):
    # TODO: add chunking for large inputs.
    # TODO: add the section in res that when is the last time you asked this.

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
                      user_id=user_id
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

    #decide what operations to use
    try:
        decision_query= send_prompt_to_decide(embeddable_queries)
        decisions= json.loads(decision_query)["strategies"]
    except Exception:
        raise HTTPException(status_code=502, detail="Error while deciding the operations")

    #search
    try:
        search_results= retrieve_queries(db, user_id, embeddable_queries, decisions,
                                         embeddings, db_message.id, send_prompt_to_plan)
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Search could not be completed")
    except Exception:
        raise HTTPException(status_code=502, detail="Search plan could not be generated")

    #stream final response
    return StreamingResponse(
        send_prompt_for_response(search_results),
        media_type="text/plain"
    )

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


# TODO: add a bg process here.
# TODO: add chunking for large inputs.
@router.post("/feed_knowledge")
async def feed_knowledge(user_id: Annotated[int, Depends(VerifyJWT)],
                         text_content: str,
                         db: Annotated[Session, Depends(get_db)],
                         queue: Annotated[ArqRedis, Depends(get_queue)]
):

    if text_content is None or text_content == '':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text cannot be empty")

    #normalise
    try:
        embeddable_query= send_prompt_to_normalize(text_content)
        embeddable_queries= json.loads(embeddable_query)["queries"]
    except Exception:
        raise HTTPException(status_code=502, detail="Query normalization failed")

    #structured metadata
    structured_metadata= json.loads(
        send_prompt_to_standardise(embeddable_queries)
    )

    #store metadata
    knowledge_ids= []
    for i, content in enumerate(embeddable_queries):
        knowledge_type= None
        if structured_metadata[i] is not None:
            knowledge_type= structured_metadata[i]["fact_type"]
        knowledge= Knowledge(text_content=content,
                             user_id=user_id,
                             knowledge_metadata= structured_metadata[i]["metadata"],
                             knowledge_type= knowledge_type
        )
        db.add(knowledge)
        db.flush()
        knowledge_ids.append(knowledge.id)
    db.commit()
    await queue.enqueue_job("create_knowledge_embedding", knowledge_ids)
    return {"message": "Knowledge fed successfully"}
