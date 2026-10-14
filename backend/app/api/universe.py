import re
import urllib.parse
from typing import Annotated, Optional

from arq import ArqRedis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from starlette import status

from app.auth.VerifyJWT import VerifyJWT
from app.core_tasks.arq_worker.get_queue import get_queue
from app.db.connect import get_db
from app.db.model.chat import Knowledge, KnowledgeCoordinate
from app.db.model.uploaded_data import DataType
from app.schema.universe import (
    ChunkDetailResponse,
    RecomputeResponse,
    SourceInfo,
    UniverseNode,
    UniverseNodesResponse,
)

router = APIRouter(prefix="/universe", tags=["universe"])


def extract_filename_from_url(url: str, fallback: str = "Uploaded Document") -> str:
    """Extract human-readable filename from Cloudinary URL or return fallback."""
    if not url:
        return fallback
    try:
        clean_url = url.split("?")[0].split("#")[0]
        segment = clean_url.rstrip("/").split("/")[-1]
        if not segment:
            return fallback
        decoded = urllib.parse.unquote(segment)
        return decoded or fallback
    except Exception:
        return fallback


def derive_chunk_title(text: str, metadata: dict, knowledge_type: str) -> str:
    """Derive a concise, recognizable star title from semantic metadata or content."""
    if isinstance(metadata, dict):
        for key in ("title", "item", "person", "subject", "topic", "category"):
            val = metadata.get(key)
            if val and isinstance(val, str) and len(val.strip()) > 0:
                clean_val = val.strip()
                return clean_val[:40].title()

    first_line = text.strip().split("\n")[0].strip()
    words = first_line.split()
    if not words:
        return knowledge_type.replace("_", " ").title()
    if len(words) <= 6:
        return " ".join(words)[:40]
    return " ".join(words[:6])[:37] + "..."


@router.get("/nodes", response_model=UniverseNodesResponse)
async def get_universe_nodes(
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
    db: Annotated[Session, Depends(get_db)],
    queue: Annotated[ArqRedis, Depends(get_queue)],
):
    """Retrieve the authenticated user's 3D star coordinates and summary

    visualization nodes. If chunks exist but no coordinates are projected yet,
    triggers background UMAP calculation.
    """
    # Query all user knowledge with coordinates and source uploads in a single query
    stmt = (
        select(Knowledge)
        .options(
            joinedload(Knowledge.coordinate),
            joinedload(Knowledge.uploaded_data),
        )
        .where(Knowledge.user_id == authenticated_user_id)
        .order_by(Knowledge.id.asc())
    )
    knowledge_records = db.execute(stmt).unique().scalars().all()

    total_stars = len(knowledge_records)
    nodes = []
    unprojected_count = 0

    for k in knowledge_records:
        coord = k.coordinate
        if coord is None:
            unprojected_count += 1
            continue

        preview = k.text_content[:140].strip()
        if len(k.text_content) > 140:
            preview += "..."

        source = k.uploaded_data
        source_type = source.data_type.value if source else "text"
        source_name = None
        has_source = False

        if source:
            has_source = True
            if source.data_type in (DataType.DOCS, DataType.IMG):
                source_name = extract_filename_from_url(
                    source.data_source,
                    fallback=f"{source.tag.upper() if source.tag else 'Uploaded'} File",
                )

        title = derive_chunk_title(k.text_content, k.knowledge_metadata, k.knowledge_type)

        nodes.append(
            UniverseNode(
                id=k.id,
                x=coord.x,
                y=coord.y,
                z=coord.z,
                title=title,
                preview=preview,
                knowledge_type=k.knowledge_type,
                cluster_id=coord.cluster_id,
                cluster_name=coord.cluster_name,
                source_type=source_type,
                source_name=source_name,
                has_source=has_source,
                created_at=k.created_at,
            )
        )

    # If user has chunks but none are projected, trigger initial background projection
    is_projected = len(nodes) > 0 or total_stars == 0
    if total_stars > 0 and len(nodes) == 0:
        try:
            lock_acquired = await queue.set(
                f"universe_lock:{authenticated_user_id}", "1", ex=15, nx=True
            )
            if lock_acquired:
                await queue.enqueue_job(
                    "calculate_universe_coordinates", authenticated_user_id
                )
        except Exception:
            pass

    return UniverseNodesResponse(
        total_stars=total_stars,
        is_projected=is_projected,
        unprojected_count=unprojected_count,
        nodes=nodes,
    )


@router.get("/chunk/{knowledge_id}", response_model=ChunkDetailResponse)
async def get_chunk_detail(
    knowledge_id: int,
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve complete chunk text, dynamic JSONB metadata, chunk position,

    and parent document information when a user selects a star.
    """
    stmt = (
        select(Knowledge)
        .options(joinedload(Knowledge.uploaded_data))
        .where(
            Knowledge.id == knowledge_id,
            Knowledge.user_id == authenticated_user_id,
        )
    )
    knowledge = db.execute(stmt).unique().scalar_one_or_none()

    if knowledge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge chunk not found",
        )

    source_info = None
    if knowledge.uploaded_data:
        up = knowledge.uploaded_data
        source_info = SourceInfo(
            id=up.id,
            data_type=up.data_type.value,
            tag=up.tag,
            data_source=up.data_source,
            created_at=up.created_at,
        )

    return ChunkDetailResponse(
        id=knowledge.id,
        text_content=knowledge.text_content,
        knowledge_type=knowledge.knowledge_type,
        metadata=knowledge.knowledge_metadata or {},
        chunk_index=knowledge.chunk_index,
        page_number=knowledge.page_number,
        created_at=knowledge.created_at,
        source=source_info,
    )


@router.post("/recompute", response_model=RecomputeResponse, status_code=status.HTTP_202_ACCEPTED)
async def recompute_universe_coordinates(
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
    queue: Annotated[ArqRedis, Depends(get_queue)],
):
    """Trigger an asynchronous recalculation of Memory Universe 3D coordinates

    for the authenticated user.
    """
    try:
        # Check if job is currently debounced/running
        lock_acquired = await queue.set(
            f"universe_lock:{authenticated_user_id}", "1", ex=20, nx=True
        )
        if not lock_acquired:
            return RecomputeResponse(
                message="Universe recalculation is already in progress or recently requested",
                status="in_progress",
                job_id=None,
            )

        job = await queue.enqueue_job(
            "calculate_universe_coordinates", authenticated_user_id
        )
        return RecomputeResponse(
            message="Universe recalculation job enqueued",
            status="accepted",
            job_id=job.job_id if job else None,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enqueue universe recompute job: {str(exc)}",
        )
