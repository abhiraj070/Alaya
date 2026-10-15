from enum import Enum
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Text,
    Enum as SQLEnum,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from .connect import Base


class DataType(str, Enum):
    DOCS = 'docs'
    IMG = 'img'
    TEXT = 'text'


class EmbeddingKind(str, Enum):
    MESSAGE = 'message'
    KNOWLEDGE = 'knowledge'


class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    username = Column(Text, unique=True, nullable=False)
    password = Column(Text, nullable=False)
    refreshToken = Column(Text)

    knowledge = relationship("Knowledge", back_populates="user", cascade="all, delete-orphan")
    uploaded_data = relationship("UploadedData", back_populates="user", cascade="all, delete-orphan")


class UploadedData(Base):
    __tablename__ = 'uploaded_data'
    id = Column(Integer, primary_key=True)
    data_type = Column(
        SQLEnum(DataType, name='data_type', values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    tag = Column(Text, nullable=True)
    data_source = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="uploaded_data")
    knowledge = relationship("Knowledge", back_populates="uploaded_data")


class Knowledge(Base):
    __tablename__ = 'knowledge'
    id = Column(Integer, primary_key=True)
    knowledge_type = Column(Text, nullable=False)
    knowledge_metadata = Column("metadata", JSONB, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    text_content = Column(Text, nullable=False)
    uploaded_data_id = Column(Integer, ForeignKey('uploaded_data.id', ondelete='SET NULL'), nullable=True)
    chunk_index = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="knowledge")
    uploaded_data = relationship("UploadedData", back_populates="knowledge")
    coordinate = relationship(
        "KnowledgeCoordinate",
        back_populates="knowledge",
        uselist=False,
        cascade="all, delete-orphan",
    )
    embeddings = relationship(
        "Embedding",
        back_populates="knowledge",
        cascade="all, delete-orphan",
    )


class KnowledgeCoordinate(Base):
    __tablename__ = 'knowledge_coordinates'
    knowledge_id = Column(Integer, ForeignKey('knowledge.id', ondelete='CASCADE'), primary_key=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    z = Column(Float, nullable=False)
    cluster_id = Column(Integer, nullable=True)
    cluster_name = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    knowledge = relationship("Knowledge", back_populates="coordinate")


class Embedding(Base):
    __tablename__ = 'embeddings'
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, nullable=True)
    knowledge_id = Column(Integer, ForeignKey('knowledge.id'), nullable=True)
    kind = Column(SQLEnum(EmbeddingKind, name='embedding_kind'), nullable=False)
    embedded_text = Column(Text, nullable=False)
    seq = Column(Integer, nullable=True)
    vector = Column(Vector(1536), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    knowledge = relationship("Knowledge", back_populates="embeddings")
