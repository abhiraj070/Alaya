from sqlalchemy import select
from fastapi import HTTPException
from cloudinary.exceptions import Error as CloudinaryError
from starlette import status
import asyncio
import json
from pathlib import Path

from app.core_tasks.llm_calls.prompts import send_prompt_to_read_image, send_prompt_to_standardise, send_prompt_to_normalize
from app.core_tasks.chunking.recursive_chunk import recursive_chunk
from app.core_tasks.extraction.extractor import extract_text
from app.db.connect import SessionLocal
from app.utility.cloudinary import delete_file
from app.db.model.chat import Embedding, EmbeddingKind, Knowledge
from app.db.model.uploaded_data import UploadedData
from app.core_tasks.llm_setup.embeddings_llm import get_embedding
from app.core_tasks.projection.projection_service import project_user_knowledge
from app.core_tasks.arq_worker.arqRedis_init import redis_settings


#inside arq_worker, we cannot use the websocket connection pool instance because here arq_worker is a whole separate process
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
        uploaded_data_id: int | None = None,
):
    db= SessionLocal()
    try:
        if not text_content or not text_content.strip():
            raise ValueError("Text cannot be empty")

        #normalize bounded chunks without repeating overlap text
        embeddable_queries= []
        for chunk in recursive_chunk(text_content, chunk_size=2000, chunk_overlap=0):
            for attempt in range(2):
                try:
                    normalized_data= json.loads(await send_prompt_to_normalize(chunk, max_tokens=4096))
                    if not isinstance(normalized_data, dict):
                        raise ValueError("Normalized response must be an object")
                    queries= normalized_data.get("queries")
                    if not isinstance(queries, list) or not queries:
                        raise ValueError("Queries must be a non-empty list")
                    if not all(isinstance(query, str) and query.strip() for query in queries):
                        raise ValueError("Each query must be a non-empty string")
                    embeddable_queries.extend(queries)
                    break
                except Exception as exc:
                    if attempt == 1:
                        raise ValueError("Query normalization failed") from exc

        #structured metadata in small batches
        structured_metadata= []
        for start in range(0, len(embeddable_queries), 4):
            queries= embeddable_queries[start:start + 4]
            for attempt in range(2):
                try:
                    metadata_batch= json.loads(await send_prompt_to_standardise(queries, max_tokens=4096))
                    if not isinstance(metadata_batch, list) or len(metadata_batch) != len(queries):
                        raise ValueError("Metadata count must match query count")
                    for metadata in metadata_batch:
                        if not isinstance(metadata, dict):
                            raise ValueError("Each metadata item must be an object")
                        if not isinstance(metadata.get("fact_type"), str) or not metadata["fact_type"].strip():
                            raise ValueError("Each metadata item must contain a fact type")
                        if not isinstance(metadata.get("metadata"), dict):
                            raise ValueError("Each metadata item must contain a metadata object")
                    structured_metadata.extend(metadata_batch)
                    break
                except Exception as exc:
                    if attempt == 1:
                        raise ValueError("Metadata generation failed") from exc

        for attempt in range(2):
            try:
                embeddings= await get_embedding(embeddable_queries)
                if not isinstance(embeddings, list) or len(embeddings) != len(embeddable_queries):
                    raise ValueError("Embedding count must match input count")
                if not all(isinstance(embedding, dict) and "vector" in embedding for embedding in embeddings):
                    raise ValueError("Embedding response is invalid")
                break
            except Exception as exc:
                if attempt == 1:
                    raise ValueError("Error while creating embeddings") from exc

        if uploaded_data_id is not None and db.execute(select(UploadedData.id).where(
            UploadedData.id == uploaded_data_id, UploadedData.user_id == user_id,
        ).with_for_update()).scalar_one_or_none() is None:
            return

        for i, content in enumerate(embeddable_queries):
            knowledge= Knowledge(text_content=content,
                                 user_id=user_id,
                                 knowledge_metadata=structured_metadata[i]["metadata"],
                                 knowledge_type=structured_metadata[i]["fact_type"],
                                 uploaded_data_id=uploaded_data_id,
                                 chunk_index=i,
                                 page_number=None,
            )
            db.add(knowledge)
            db.flush()
            db.add(Embedding(knowledge_id=knowledge.id,
                             kind=EmbeddingKind.KNOWLEDGE,
                             embedded_text=content,
                             vector=embeddings[i]["vector"],
            ))

        db.commit()
        await publish_websocket_status(ctx, user_id, "completed", "Data stored successfully")
        try:
            project_user_knowledge(user_id, db=db)
        except Exception:
            pass
    except Exception:
        db.rollback()
        await publish_websocket_status(ctx, user_id, "Failed", "Unable to store the data")
        raise
    finally:
        db.close()

async def create_image_embeddings(
        ctx,
        user_id: int,
        upload_result:dict[str, str],
        uploaded_data_id: int | None = None,
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

        async def get_metadata():
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
                    return structured_metadata
                except Exception:
                    if attempt == 1:
                        raise HTTPException(status_code=502, detail="Metadata generation failed")

        async def get_image_embedding():
            for attempt in range(2):
                try:
                    embeddings = await get_embedding([image_string])
                    if not isinstance(embeddings, list) or len(embeddings) != 1:
                        raise ValueError("Embedding count must match input count")
                    if not isinstance(embeddings[0], dict) or "vector" not in embeddings[0]:
                        raise ValueError("Embedding response is invalid")
                    return embeddings
                except Exception:
                    if attempt == 1:
                        raise HTTPException(status_code=502, detail="Error while creating embeddings")

        structured_metadata, embeddings = await asyncio.gather(get_metadata(), get_image_embedding())

        if uploaded_data_id is not None and db.execute(select(UploadedData.id).where(
            UploadedData.id == uploaded_data_id, UploadedData.user_id == user_id,
        ).with_for_update()).scalar_one_or_none() is None:
            return

        knowledge = Knowledge(knowledge_type=structured_metadata["fact_type"],
                              user_id=user_id,
                              text_content=image_string,
                              knowledge_metadata=structured_metadata["metadata"],
                              uploaded_data_id=uploaded_data_id,
                              chunk_index=0,
                              page_number=None,
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
        try:
            project_user_knowledge(user_id, db=db)
        except Exception:
            pass

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

async def create_file_embeddings(
        ctx,
        file_path: str,
        user_id: int,
        uploaded_data_id: int | None = None,
):
    db= SessionLocal()
    try:
        try:
            text= extract_text(file_path)
        except Exception:
            raise HTTPException(status_code=502, detail="Error while extracting text")

        try:
            chunks= recursive_chunk(text)
            if not chunks:
                raise ValueError("Text cannot be empty")
        except Exception:
            raise HTTPException(status_code=502, detail="Error while creating chunks")

        # Determine page numbers for chunks if PDF
        chunk_pages = []
        if Path(file_path).suffix.lower() == ".pdf":
            import re
            current_page = 1
            for chunk in chunks:
                page_markers = list(re.finditer(r'\[Page\s+(\d+)\]', chunk))
                if page_markers:
                    first_marker = page_markers[0]
                    if first_marker.start() == 0 or not chunk[:first_marker.start()].strip():
                        chunk_page = int(first_marker.group(1))
                    else:
                        chunk_page = current_page
                    current_page = int(page_markers[-1].group(1))
                else:
                    chunk_page = current_page
                chunk_pages.append(chunk_page)
        else:
            chunk_pages = [None] * len(chunks)

        #structured metadata
        structured_metadata= []
        for chunk in chunks:
            for attempt in range(2):
                try:
                    metadata_list= json.loads(await send_prompt_to_standardise([chunk]))
                    if not isinstance(metadata_list, list) or len(metadata_list) != 1:
                        raise ValueError("Metadata count must match chunk count")
                    metadata= metadata_list[0]
                    if not isinstance(metadata, dict):
                        raise ValueError("Each metadata item must be an object")
                    if not isinstance(metadata.get("fact_type"), str) or not metadata["fact_type"].strip():
                        raise ValueError("Each metadata item must contain a fact type")
                    if not isinstance(metadata.get("metadata"), dict):
                        raise ValueError("Each metadata item must contain a metadata object")
                    structured_metadata.append(metadata)
                    break
                except Exception:
                    if attempt == 1:
                        raise HTTPException(status_code=502, detail="Metadata generation failed")

        for attempt in range(2):
            try:
                embeddings = await get_embedding(chunks)
                if not isinstance(embeddings, list) or len(embeddings) != len(chunks):
                    raise ValueError("Embedding count must match chunk count")
                if not all(isinstance(embedding, dict) and "vector" in embedding for embedding in embeddings):
                    raise ValueError("Embedding response is invalid")
                break
            except Exception:
                if attempt == 1:
                    raise HTTPException(status_code=502, detail="Error while creating embeddings")

        if uploaded_data_id is not None and db.execute(select(UploadedData.id).where(
            UploadedData.id == uploaded_data_id, UploadedData.user_id == user_id,
        ).with_for_update()).scalar_one_or_none() is None:
            return

        for i, chunk in enumerate(chunks):
            knowledge= Knowledge(text_content=chunk,
                                 user_id=user_id,
                                 knowledge_metadata=structured_metadata[i]["metadata"],
                                 knowledge_type=structured_metadata[i]["fact_type"],
                                 uploaded_data_id=uploaded_data_id,
                                 chunk_index=i,
                                 page_number=chunk_pages[i],
            )
            db.add(knowledge)
            db.flush()
            db_embeddings= Embedding(knowledge_id=knowledge.id,
                                     kind=EmbeddingKind.KNOWLEDGE,
                                     embedded_text=chunk,
                                     vector=embeddings[i]["vector"]
            )
            db.add(db_embeddings)

        db.commit()
        try:
            project_user_knowledge(user_id, db=db)
        except Exception:
            pass
        await publish_websocket_status(ctx, user_id, "completed", "Data stored successfully")

    except Exception:
        db.rollback()
        await publish_websocket_status(ctx, user_id, "Failed", "Unable to store the data")
        raise
    finally:
        db.close()
        Path(file_path).unlink(missing_ok=True)

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
    functions= [
        create_knowledge_embedding,
        create_image_embeddings,
        create_file_embeddings,
    ]
    redis_settings= redis_settings

