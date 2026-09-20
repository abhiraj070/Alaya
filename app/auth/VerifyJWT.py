import jwt
from fastapi import HTTPException, Depends, Request
from sqlalchemy.orm import Session
from starlette import status
from app.env_config.settings import get_settings
from app.db.connect import get_db
from typing import Annotated

settings = get_settings()

def VerifyJWT(request: Request, db: Annotated[Session, Depends(get_db)]):
    authorization= request.headers.get('Authorization')
    access_token= authorization.split(" ", 1)[1] if authorization and authorization.startswith("Bearer ") else request.cookies.get('access_token')
    if access_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    try:
        decoded = jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id= decoded.get('user_id')
        type = decoded.get('type')
        if type == "refresh":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing access token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return user_id
