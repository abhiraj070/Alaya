import urllib.parse
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from starlette import status

from app.auth.VerifyJWT import VerifyJWT
from app.core_tasks.projection.projection_service import project_user_knowledge
from app.db.connect import get_db
from app.db.model.chat import Knowledge
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
def get_universe_nodes(
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve the authenticated user's 3D star coordinates and summary visualization nodes."""
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

        if source and source.data_type.value != "text":
            has_source = True
            fallback_label = f"Document #{source.id}" if source.data_type.value == "docs" else f"Image #{source.id}"
            source_name = extract_filename_from_url(
                source.data_source,
                fallback=fallback_label,
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
                content_type=source_type,
                metadata=k.knowledge_metadata or {},
            )
        )

    is_projected = (total_stars > 0) and (unprojected_count == 0)

    return UniverseNodesResponse(
        nodes=nodes,
        total_stars=total_stars,
        is_projected=is_projected,
        unprojected_count=unprojected_count,
    )


@router.get("/chunks/{knowledge_id}", response_model=ChunkDetailResponse)
def get_chunk_detail(
    knowledge_id: int,
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve complete chunk detail including text content, semantic metadata,
    chunk index, page number, and source lineage.
    Strictly verifies ownership.
    """
    stmt = (
        select(Knowledge)
        .options(joinedload(Knowledge.uploaded_data))
        .where(
            Knowledge.id == knowledge_id,
            Knowledge.user_id == authenticated_user_id,
        )
    )
    chunk = db.execute(stmt).scalar_one_or_none()

    if chunk is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge chunk not found or access denied.",
        )

    source_info = None
    if chunk.uploaded_data:
        source_info = SourceInfo(
            id=chunk.uploaded_data.id,
            data_type=chunk.uploaded_data.data_type.value,
            tag=chunk.uploaded_data.tag,
            data_source=chunk.uploaded_data.data_source,
            created_at=chunk.uploaded_data.created_at,
        )

    return ChunkDetailResponse(
        id=chunk.id,
        text_content=chunk.text_content,
        knowledge_type=chunk.knowledge_type,
        metadata=chunk.knowledge_metadata or {},
        chunk_index=chunk.chunk_index,
        page_number=chunk.page_number,
        created_at=chunk.created_at,
        source=source_info,
    )


@router.post("/recompute", response_model=RecomputeResponse)
def recompute_coordinates(
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
    db: Annotated[Session, Depends(get_db)],
):
    """Trigger UMAP 3D celestial coordinate recalculation for authenticated user."""
    try:
        result = project_user_knowledge(authenticated_user_id, db=db)
        count = result.get("count", 0)
        return RecomputeResponse(
            message=result.get("message", "Coordinates calculated successfully."),
            status="completed",
            total_nodes=count,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Coordinate recomputation failed: {str(exc)}",
        )
