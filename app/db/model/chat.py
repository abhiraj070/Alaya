from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Text,
    ForeignKey,
    Enum as SQLEnum, func,
)
from sqlalchemy.orm import relationship
from app.db.connect import Base
from enum import Enum

class Sender(str, Enum):
    LLM = 'LLM'
    USER = 'USER'


class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    username = Column(Text, nullable=False)
    password = Column(Text, nullable=False)
    chats = relationship("Chat", back_populates="user")
    refreshToken = Column(Text, nullable=False)


class Chat(Base):
    __tablename__ = 'chat'
    id = Column(Integer, primary_key=True)
    chat_title = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'))
    user= relationship(User, back_populates='chats')
    messages = relationship("Message", back_populates='chat')


class Message(Base):
    __tablename__ = 'message'
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey('chat.id'))
    chat= relationship(Chat, back_populates='messages')
    sent_by= Column(SQLEnum(Sender, name='sender'))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False )
