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


#inside worker, we cannot use the websocket connection pool instance because here worker is a whole separate process
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
        for attempt in range(2):
            try:
                embeddable_query= await send_prompt_to_normalize(text_content)
                normalized_data= json.loads(embeddable_query)
                if not isinstance(normalized_data, dict):
                    raise ValueError("Normalized response must be an object")
                embeddable_queries= normalized_data.get("queries")
                if not isinstance(embeddable_queries, list) or len(embeddable_queries) == 0:
                    raise ValueError("Queries must be a non-empty list")
                if not all(isinstance(query, str) and query.strip() for query in embeddable_queries):
                    raise ValueError("Each query must be a non-empty string")
                break
            except Exception:
                if attempt == 1:
                    raise HTTPException(status_code=502, detail="Query normalization failed")

        #structured metadata
        for attempt in range(2):
            try:
                structured_metadata= json.loads(
                    await send_prompt_to_standardise(embeddable_queries)
                )
                if not isinstance(structured_metadata, list):
                    raise ValueError("Structured metadata must be a list")
                if len(structured_metadata) != len(embeddable_queries):
                    raise ValueError("Metadata count must match query count")
                for metadata in structured_metadata:
                    if not isinstance(metadata, dict):
                        raise ValueError("Each metadata item must be an object")
                    if not isinstance(metadata.get("fact_type"), str) or not metadata["fact_type"].strip():
                        raise ValueError("Each metadata item must contain a fact type")
                    if not isinstance(metadata.get("metadata"), dict):
                        raise ValueError("Each metadata item must contain a metadata object")
                break
            except Exception:
                if attempt == 1:
                    raise HTTPException(status_code=502, detail="Metadata generation failed")

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
            for attempt in range(2):
                try:
                    embeddings= await get_embedding([knowledge.text_content])
                    if not isinstance(embeddings, list) or len(embeddings) != 1:
                        raise ValueError("Embedding count must match input count")
                    if not isinstance(embeddings[0], dict) or "vector" not in embeddings[0]:
                        raise ValueError("Embedding response is invalid")
                    break
                except Exception:
                    if attempt == 1:
                        raise HTTPException(status_code=502, detail="Error while creating embeddings")
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
        for attempt in range(2):
            try:
                image_obj = json.loads(await send_prompt_to_read_image(upload_result["secure_url"]))
                if not isinstance(image_obj, dict):
                    raise ValueError("Image response must be an object")
                image_string = image_obj.get("string")
                if not isinstance(image_string, str) or not image_string.strip():
                    raise ValueError("Image response must contain a non-empty string")
                break
            except Exception:
                if attempt == 1:
                    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error in reading the image")

        for attempt in range(2):
            try:
                structured_metadata_list = json.loads(await send_prompt_to_standardise([image_string]))
                if not isinstance(structured_metadata_list, list) or len(structured_metadata_list) != 1:
                    raise ValueError("Metadata count must match input count")
                structured_metadata = structured_metadata_list[0]
                if not isinstance(structured_metadata, dict):
                    raise ValueError("Metadata must be an object")
                if not isinstance(structured_metadata.get("fact_type"), str) or not structured_metadata["fact_type"].strip():
                    raise ValueError("Metadata must contain a fact type")
                if not isinstance(structured_metadata.get("metadata"), dict):
                    raise ValueError("Metadata must contain a metadata object")
                break
            except Exception:
                if attempt == 1:
                    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error in reading the image")

        for attempt in range(2):
            try:
                embeddings = await get_embedding([image_string])
                if not isinstance(embeddings, list) or len(embeddings) != 1:
                    raise ValueError("Embedding count must match input count")
                if not isinstance(embeddings[0], dict) or "vector" not in embeddings[0]:
                    raise ValueError("Embedding response is invalid")
                break
            except Exception:
                if attempt == 1:
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
