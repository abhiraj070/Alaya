from enum import Enum
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Text,
    ForeignKey,
    Enum as SQLEnum,
    func,
)
from sqlalchemy.orm import relationship
from app.db.connect import Base
from app.db.model.user import User


class DataType(str, Enum):
    DOCS = 'docs'
    IMG = 'img'
    TEXT = 'text'


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
    user = relationship(User, back_populates='uploaded_data')
    knowledge = relationship("Knowledge", back_populates='uploaded_data')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
