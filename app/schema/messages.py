from pydantic import BaseModel, Field

class MessageResponse(BaseModel):
    message_content: str
    chat_id: int
    message_id: int = Field(validation_alias="id")
    search_results: list[dict] = Field(default_factory=list)

class MessageRequest(BaseModel):
    message_content: str
    user_id: int

class MessageUpdateRequest(BaseModel):
    message_content: str
