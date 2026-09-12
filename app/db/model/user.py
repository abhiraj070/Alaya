from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, Text, event
from app.db.connect import Base
from argon2 import PasswordHasher

ph = PasswordHasher()

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    username = Column(Text, nullable=False)
    password = Column(Text, nullable=False)
    chats = relationship("Chat", back_populates="user")
    messages = relationship("Message", back_populates="user")
    refreshToken = Column(Text, nullable=False)

def already_hashed(password: str)->bool:
    return password.startswith("$argon2id$")

@event.listens_for(User, "before_insert")
def hash_password(mapper, connection, target):
    if not already_hashed(target.password):
        hashed_password = ph.hash(target.password)
        target.password = hashed_password