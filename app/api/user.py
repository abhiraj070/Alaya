from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated

from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import Response

from app.auth.VerifyJWT import VerifyJWT
from app.db.connect import get_db
from app.db.model.user import User
from app.schema.user import RegisterRequest, AuthResponse, LoginRequest

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
import jwt
from app.env_config.settings import get_settings


router= APIRouter(prefix= "/user", tags= ["user"])

ph= PasswordHasher()
settings = get_settings()

def get_user_from_id(user_id: int, db: Session):
    # db.query is old now we use select
    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user

def generate_tokens(user_id: int):
    access_token = jwt.encode(
        {
            "user_id": user_id,
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    refresh_token = jwt.encode(
        {
            "user_id": user_id,
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=30),
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    return {"access_token": access_token, "refresh_token": refresh_token}

@router.post("/register", response_model= AuthResponse)
async def register(request: RegisterRequest,
                   db: Annotated[Session, Depends(get_db)]
):
    user=User(
       name= request.name,
       username= request.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model= AuthResponse)
async def login(request: LoginRequest, db: Annotated[Session, Depends(get_db)], response: Response):
    stmt= select(User).where(User.username == request.username)
    user = db.execute(stmt).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    try:
        ph.verify(user.password, request.password)
    except VerifyMismatchError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    except VerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

    tokens = generate_tokens(user.id)

    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=15 * 60,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
    )

    return user