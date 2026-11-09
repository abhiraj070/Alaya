from sqlalchemy.orm import relationship, validates
from sqlalchemy import Column, Integer, Text, event
from app.db.connect import Base
from argon2 import PasswordHasher
from app.utility.phone_number import normalize_phone_number

ph = PasswordHasher()

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    username = Column(Text, nullable=False)
    phone_number = Column(Text, nullable=True, unique=True)
    password = Column(Text, nullable=False)
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    knowledge = relationship("Knowledge", back_populates="user", cascade="all, delete-orphan")
    uploaded_data = relationship("UploadedData", back_populates="user", cascade="all, delete-orphan")
    refreshToken = Column(Text, nullable=False)
    token_version = Column(Integer, nullable=False, default=0, server_default="0")

    @validates("phone_number")
    def normalize_phone(self, key, value):
        return normalize_phone_number(value) if value is not None else None

def already_hashed(password: str)->bool:
    return password.startswith("$argon2id$")

@event.listens_for(User, "before_insert")
def hash_password(mapper, connection, target):
    if not already_hashed(target.password):
        hashed_password = ph.hash(target.password)
        target.password = hashed_password
