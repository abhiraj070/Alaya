from pydantic import BaseModel

class ChatResponse(BaseModel):
    id : int
    chat_title : int
    user_id : int


class ChatRequest(BaseModel):
    chat_title: int
    user_id: int