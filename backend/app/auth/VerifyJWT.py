import jwt
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from starlette.requests import HTTPConnection
from starlette import status
from app.env_config.settings import get_settings
from app.db.connect import get_db
from typing import Annotated
from app.db.model.user import User

settings = get_settings()

def decode_access_token_claims(access_token: str | None) -> dict:
    if not access_token or not access_token.strip():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    access_token = access_token.strip()
    if access_token.startswith("Bearer "):
        access_token = access_token.split(" ", 1)[1].strip()
    try:
        decoded = jwt.decode(
            access_token, settings.SECRET_KEY, algorithms=["HS256"],
            options={"require": ["exp", "user_id", "type"]},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if decoded["type"] == "refresh":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing access token")
    user_id = decoded["user_id"]
    if decoded["type"] != "access" or type(user_id) is not int or user_id <= 0:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return decoded


def decode_access_token(access_token: str | None) -> int:
    return decode_access_token_claims(access_token)["user_id"]


def verify_token_session(claims: dict, user: User | None) -> None:
    version = claims.get("token_version", 0)
    if user is None or type(version) is not int or version != user.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired; please sign in again")


def VerifyJWT(connection: HTTPConnection, db: Annotated[Session, Depends(get_db)]):
    authorization= connection.headers.get('Authorization')
    access_token= authorization.split(" ", 1)[1] if authorization and authorization.startswith("Bearer ") else connection.cookies.get('access_token')
    if access_token is None and hasattr(connection, 'query_params'):
        access_token = connection.query_params.get('token')
    claims = decode_access_token_claims(access_token)
    verify_token_session(claims, db.get(User, claims["user_id"]))
    return claims["user_id"]
