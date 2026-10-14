from datetime import datetime
from pydantic import BaseModel

class ChatResponse(BaseModel):
    id : int
    chat_title : str
    user_id : int
    created_at : datetime | None = None
    updated_at : datetime | None = None


class ChatRequest(BaseModel):
    chat_title: str
    user_id: int

class ChatUpdateRequest(BaseModel):
    chat_title: str | None
    first_chat: str | None
