from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.VerifyJWT import VerifyJWT
from app.db.connect import get_db
from app.db.model.uploaded_data import UploadedData
from app.schema.uploaded_data import UploadedDataResponse
from app.api.user import generate_tokens

router = APIRouter(prefix="/universe", tags=["universe"])


@router.get("/uploads", response_model=list[UploadedDataResponse])
def get_universe_uploads(
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
    db: Annotated[Session, Depends(get_db)],
):
    """Read every upload, including records whose knowledge processing is pending."""
    statement = select(UploadedData).where(
        UploadedData.user_id == authenticated_user_id,
    ).order_by(UploadedData.id.asc())
    return db.execute(statement).scalars().all()


@router.get("/token")
def get_universe_token(
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
):
    tokens = generate_tokens(authenticated_user_id)
    return {"token": tokens["access_token"]}
