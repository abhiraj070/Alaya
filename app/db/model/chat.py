from sqlalchemy import (
    Column,
    DateTime,
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
    user_id = Column(Integer, ForeignKey('user.id'))
    user= relationship(User, back_populates='knowledge')
    text_content= Column(Text, nullable=False)
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
