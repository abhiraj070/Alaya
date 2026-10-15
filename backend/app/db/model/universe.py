"""Persisted display coordinates; knowledge and embeddings remain in chat.py."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from app.db.connect import Base


class KnowledgeCoordinate(Base):
    __tablename__ = "knowledge_coordinates"

    knowledge_id = Column(Integer, ForeignKey("knowledge.id", ondelete="CASCADE"), primary_key=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    z = Column(Float, nullable=False)
    cluster_id = Column(Integer, nullable=True)
    cluster_name = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    knowledge = relationship("Knowledge", back_populates="coordinate")
