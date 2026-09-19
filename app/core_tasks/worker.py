from sqlalchemy import select

from app.db.connect import SessionLocal
from app.db.model.chat import Embedding, EmbeddingKind, Knowledge, Message
from app.core_tasks.embeddings import get_embedding
from app.core_tasks.queue import redis_settings

async def create_knowledge_embedding(ctx, knowledge_ids: list[int]):
    db= SessionLocal()
    try:
        for knowledge_id in knowledge_ids:
            stmt= select(Knowledge).where(Knowledge.id==knowledge_id)
            knowledge= db.execute(stmt).scalar_one_or_none()
            if knowledge is None:
                return
            stmt= select(Embedding).where(Embedding.knowledge_id==knowledge_id)
            embedding= db.execute(stmt).scalar_one_or_none()
            if embedding is not None:
                return
            embeddings= await get_embedding([knowledge.text_content])
            db_embeddings= Embedding(knowledge_id= knowledge.id,
                                     kind= EmbeddingKind.KNOWLEDGE,
                                     embedded_text= knowledge.text_content,
                                     vector= embeddings[0]["vector"]
            )
            db.add(db_embeddings)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# async def create_message_embedding(ctx, message_id: int):
#     db= SessionLocal()
#     try:
#         stmt= select(Message).where(Message.id==message_id)
#         message= db.execute(stmt).scalar_one_or_none()
#         if message is None:
#             return
#         stmt= select(Embedding).where(Embedding.message_id==message_id)
#         embedding= db.execute(stmt).scalar_one_or_none()
#         if embedding is not None:
#             return
#         embeddings= await get_embedding([message.message_content])
#         db_embeddings= Embedding(message_id= message.id,
#                                  kind= EmbeddingKind.MESSAGE,
#                                  embedded_text= message.message_content,
#                                  vector= embeddings[0]
#         )
#         db.add(db_embeddings)
#         db.commit()
#         db.refresh(db_embeddings)
#     except Exception:
#         db.rollback()
#         raise
#     finally:
#         db.close()

class WorkerSettings:
    functions= [create_knowledge_embedding]
    redis_settings= redis_settings
