from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated

from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import Response

from app.db.connect import get_db
from app.db.model.user import User
from app.schema.user import RegisterRequest, AuthResponse, LoginRequest, UserUpdateRequest

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
import jwt
from app.env_config.settings import get_settings
from app.auth.VerifyJWT import VerifyJWT


router= APIRouter(prefix= "/user", tags= ["user"])

ph= PasswordHasher()
settings = get_settings()

def generate_tokens(user_id: int):
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = jwt.encode(
        {
            "user_id": user_id,
            "type": "access",
            "exp": datetime.now(timezone.utc) + access_token_expires,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    refresh_token = jwt.encode(
        {
            "user_id": user_id,
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + refresh_token_expires,
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
       phone_number= request.phone_number,
       password= request.password,
       refreshToken= "",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/get_user/{user_id}", response_model=AuthResponse)
async def get_user(user_id: int, db: Annotated[Session, Depends(get_db)],
                   authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    if user_id != authenticated_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    stmt= select(User).where(User.id==user_id)
    user= db.execute(stmt).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

def update_user_helper(db: Session, name: str, username: str, phone_number: str | None = None, user_id: int | None = None):
    if user_id is not None:
        stmt = select(User).where(User.id == user_id)
    elif phone_number:
        stmt = select(User).where(User.phone_number == phone_number)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID or phone number is required")
    matches = db.execute(stmt).scalars().all()
    if len(matches) > 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number matches multiple users")
    user = matches[0] if matches else None
    if user is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User not found")
    if username != "":
        stmt2 = select(User).where(User.username == username, User.id != user.id)
        if db.execute(stmt2).first() is not None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Username already taken")
    if user_id is not None and phone_number:
        stmt2 = select(User).where(User.phone_number == phone_number, User.id != user.id)
        if db.execute(stmt2).first() is not None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Phone number already taken")
    if name != "":
        user.name = name
    if username != "":
        user.username = username
    if user_id is not None and phone_number:
        user.phone_number = phone_number
    db.commit()
    db.refresh(user)
    return user

@router.put("/update_user/{user_id}", response_model=AuthResponse)
async def update_user(user_id: int, request: UserUpdateRequest, db: Annotated[Session, Depends(get_db)],
                      authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    if user_id != authenticated_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return update_user_helper(db, request.name, request.username, phone_number=request.phone_number, user_id=user_id)

@router.delete("/delete_user/{user_id}")
async def delete_user(user_id: int, db: Annotated[Session, Depends(get_db)], response: Response,
                      authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    if user_id != authenticated_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    stmt= select(User).where(User.id==user_id)
    user= db.execute(stmt).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"detail": "User deleted successfully"}

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

    user.refreshToken=refresh_token
    db.commit()

    access_token_max_age = int(settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    refresh_token_max_age = int(settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=access_token_max_age,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=refresh_token_max_age,
    )

    return user

@router.put("/logout/{user_id}")
async def logout(user_id: int, db: Annotated[Session, Depends(get_db)], response: Response,
                 authenticated_user_id: Annotated[int, Depends(VerifyJWT)]):
    if user_id != authenticated_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    stmt= select(User).where(User.id==user_id)
    user= db.execute(stmt).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.refreshToken = ""
    db.commit()
    db.refresh(user)
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"message": "User logged out"}
