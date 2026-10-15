from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SourceInfo(BaseModel):
    id: int
    data_type: str
    tag: Optional[str] = None
    data_source: str
    created_at: datetime


class UniverseNode(BaseModel):
    id: int
    x: float
    y: float
    z: float
    title: str
    preview: str
    knowledge_type: str
    cluster_id: Optional[int] = None
    cluster_name: Optional[str] = None
    source_type: str
    source_name: Optional[str] = None
    has_source: bool
    created_at: datetime
    content_type: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UniverseNodesResponse(BaseModel):
    nodes: List[UniverseNode]
    total_stars: int
    is_projected: bool
    unprojected_count: int


class ChunkDetailResponse(BaseModel):
    id: int
    text_content: str
    knowledge_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    chunk_index: Optional[int] = None
    page_number: Optional[int] = None
    created_at: datetime
    source: Optional[SourceInfo] = None


class RecomputeResponse(BaseModel):
    message: str
    status: str
    total_nodes: int
