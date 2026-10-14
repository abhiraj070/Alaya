from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    Text,
    ForeignKey,
    Enum as SQLEnum, func,
)
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from app.db.connect import Base
from enum import Enum
from app.db.model.user import User
from app.db.model.uploaded_data import UploadedData
from sqlalchemy.dialects.postgresql import JSONB

class Sender(str, Enum):
    LLM = 'LLM'
    USER = 'USER'

class EmbeddingKind(str, Enum):
    MESSAGE = 'message'
    KNOWLEDGE = 'knowledge'



class Chat(Base):
    __tablename__ = 'chat'
    id = Column(Integer, primary_key=True)
    chat_title = Column(Text)
    user_id = Column(Integer, ForeignKey('user.id'))
    user= relationship(User, back_populates='chats')
    messages = relationship("Message", back_populates='chat', cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Message(Base):
    __tablename__ = 'message'
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey('chat.id'))
    chat= relationship(Chat, back_populates='messages')
    message_content = Column(Text, nullable=False)
    sent_by= Column(SQLEnum(Sender, name='sender'))
    user_id = Column(Integer, ForeignKey('user.id'))
    user= relationship(User, back_populates='messages')
    embeddings = relationship("Embedding", back_populates='message', cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False )

class Knowledge(Base):
    __tablename__ = 'knowledge'
    id = Column(Integer, primary_key=True)
    knowledge_type= Column(Text, nullable=False)
    knowledge_metadata = Column("metadata", JSONB, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'))
    user= relationship(User, back_populates='knowledge')
    text_content= Column(Text, nullable=False)
    uploaded_data_id = Column(Integer, ForeignKey('uploaded_data.id', ondelete='SET NULL'), nullable=True)
    uploaded_data = relationship(UploadedData, back_populates='knowledge')
    chunk_index = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)
    coordinate = relationship("KnowledgeCoordinate", back_populates='knowledge', uselist=False, cascade="all, delete-orphan")
    embeddings = relationship("Embedding", back_populates='knowledge', cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Embedding(Base):
    __tablename__ = 'embeddings'
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('message.id'))
    message= relationship(Message, back_populates='embeddings')
    knowledge_id = Column(Integer, ForeignKey('knowledge.id'))
    knowledge= relationship(Knowledge, back_populates='embeddings')
    kind = Column(SQLEnum(EmbeddingKind, name='embedding_kind'), nullable=False)
    embedded_text = Column(Text, nullable=False)
    seq = Column(Integer)
    vector= Column(Vector(1536), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class KnowledgeCoordinate(Base):
    __tablename__ = 'knowledge_coordinates'
    knowledge_id = Column(Integer, ForeignKey('knowledge.id', ondelete='CASCADE'), primary_key=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    z = Column(Float, nullable=False)
    cluster_id = Column(Integer, nullable=True)
    cluster_name = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    knowledge = relationship(Knowledge, back_populates='coordinate')

