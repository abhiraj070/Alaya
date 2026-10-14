from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status

from app.auth.VerifyJWT import VerifyJWT
from app.db.connect import get_db
from app.db.model.uploaded_data import UploadedData
from app.schema.uploaded_data import UploadedDataResponse

router = APIRouter(prefix="/uploaded_data", tags=["uploaded_data"])


@router.get("/get_uploads/{user_id}", response_model=list[UploadedDataResponse])
async def get_uploads(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
):
    if user_id != authenticated_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    stmt = select(UploadedData).where(UploadedData.user_id == user_id).order_by(UploadedData.created_at.desc())
    uploads = db.execute(stmt).scalars().all()
    return uploads


@router.delete("/delete_upload/{upload_id}")
async def delete_upload(
    upload_id: int,
    db: Annotated[Session, Depends(get_db)],
    authenticated_user_id: Annotated[int, Depends(VerifyJWT)],
):
    stmt = select(UploadedData).where(
        UploadedData.id == upload_id, UploadedData.user_id == authenticated_user_id
    )
    upload = db.execute(stmt).scalar_one_or_none()
    if upload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    db.delete(upload)
    db.commit()
    return {"detail": "Upload deleted successfully"}

