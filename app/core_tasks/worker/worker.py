from sqlalchemy import select
from fastapi import HTTPException
from cloudinary.exceptions import Error as CloudinaryError
from starlette import status
import json

from app.api.messages import send_prompt_to_read_image, send_prompt_to_standardise, send_prompt_to_normalize
from app.db.connect import SessionLocal
from app.utility.cloudinary import delete_file
from app.db.model.chat import Embedding, EmbeddingKind, Knowledge
from app.core_tasks.llm_setup.embeddings_llm import get_embedding
from app.core_tasks.worker.queue import redis_settings

async def publish_websocket_status(ctx, user_id: int, status: str, message: str) -> None:
    try:
        await ctx["redis"].publish(
            "websocket_messages",
            json.dumps({
                "user_id": user_id,
                "data": {
                    "status": status,
                    "message": message,
                },
            }),
        )
    except Exception:
        pass


async def create_knowledge_embedding(
        ctx,
        text_content: str,
        user_id: int,
):
    db= SessionLocal()
    try:
        if text_content is None or text_content == '':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text cannot be empty")

        #normalise
        try:
            embeddable_query= send_prompt_to_normalize(text_content)
        except Exception:
            raise HTTPException(status_code=502, detail="Query normalization failed")
        embeddable_queries= json.loads(embeddable_query)["queries"]

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

        for knowledge_id in knowledge_ids:
            stmt= select(Knowledge).where(Knowledge.id==knowledge_id)
            knowledge= db.execute(stmt).scalar_one_or_none()
            if knowledge is None:
                continue
            stmt= select(Embedding).where(Embedding.knowledge_id==knowledge_id)
            embedding= db.execute(stmt).scalar_one_or_none()
            if embedding is not None:
                continue
            embeddings= await get_embedding([knowledge.text_content])
            db_embeddings= Embedding(knowledge_id= knowledge.id,
                                     kind= EmbeddingKind.KNOWLEDGE,
                                     embedded_text= knowledge.text_content,
                                     vector= embeddings[0]["vector"]
            )
            db.add(db_embeddings)

        db.commit()

        await publish_websocket_status(
            ctx,
            user_id,
            "completed",
            "Data stored successfully",
        )

    except Exception:
        db.rollback()
        await publish_websocket_status(
            ctx,
            user_id,
            "Failed",
            "Unable to store the data",
        )
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

async def create_image_embeddings(
        ctx,
        user_id: int,
        upload_result:dict[str, str]
):
    db= SessionLocal()

    try:
        try:
            image_obj = json.loads(send_prompt_to_read_image(upload_result["secure_url"]))
            image_string = image_obj["string"]
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error in reading the image")

        try:
            structured_metadata = json.loads(send_prompt_to_standardise([image_string]))[0]
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error in reading the image")

        try:
            embeddings = await get_embedding([image_string])
        except Exception:
            raise HTTPException(status_code=502, detail="Error while creating embeddings")

        knowledge = Knowledge(knowledge_type=structured_metadata["fact_type"],
                              user_id=user_id,
                              text_content=image_string,
                              knowledge_metadata=structured_metadata["metadata"],
                              )
        db.add(knowledge)
        db.flush()
        embed_table = Embedding(
            knowledge_id=knowledge.id,
            kind=EmbeddingKind.KNOWLEDGE,
            embedded_text=image_string,
            vector=embeddings[0]["vector"]
        )
        db.add(embed_table)
        db.commit()
        await publish_websocket_status(
            ctx,
            user_id,
            "completed",
            "Data stored successfully",
        )

    except Exception:
        db.rollback()
        try:
            delete_file(
                upload_result["public_id"],
                upload_result.get("resource_type", "image"),
            )
        except CloudinaryError:
            pass
        await publish_websocket_status(
            ctx,
            user_id,
            "Failed",
            "Unable to store the data",
        )
        raise
    finally:
        db.close()

class WorkerSettings:
    functions= [create_knowledge_embedding, create_image_embeddings]
    redis_settings= redis_settings
