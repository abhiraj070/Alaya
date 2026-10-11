from pydantic import BaseModel

class ChatResponse(BaseModel):
    id : int
    chat_title : str
    user_id : int


class ChatRequest(BaseModel):
    chat_title: str
    user_id: int

class ChatUpdateRequest(BaseModel):
    chat_title: str
