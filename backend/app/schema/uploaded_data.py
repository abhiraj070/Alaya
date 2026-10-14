from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.db.model.uploaded_data import DataType


class UploadedDataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    data_type: DataType
    tag: str | None = None
    data_source: str
    user_id: int
    created_at: datetime
