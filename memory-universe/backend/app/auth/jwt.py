import os
from typing import Annotated, Optional
import jwt
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status
from starlette.requests import HTTPConnection

from app.db.connect import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "alaya_default_secret_key_change_me")
ALGORITHM = "HS256"


def VerifyJWT(connection: HTTPConnection, db: Annotated[Session, Depends(get_db)]) -> int:
    """Validate incoming JWT access token from HTTP-only cookie or Authorization header.

    Returns authenticated user_id.
    """
    authorization = connection.headers.get("Authorization")
    access_token = (
        authorization.split(" ", 1)[1]
        if authorization and authorization.startswith("Bearer ")
        else connection.cookies.get("access_token")
    )

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
        )

    try:
        decoded = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = decoded.get("user_id")
        token_type = decoded.get("type")
        if token_type == "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token cannot be used as access token",
            )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return int(user_id)
