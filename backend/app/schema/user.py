from pydantic import BaseModel, field_validator
from app.utility.phone_number import normalize_phone_number

class AuthResponse(BaseModel):
    id :int
    name : str
    username : str

class RegisterRequest(BaseModel):
    name: str
    username: str
    password: str
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        return normalize_phone_number(value)

class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserUpdateRequest(BaseModel):
    name: str = ""
    username: str = ""
    phone_number: str = ""

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        value = value.strip()
        if not value:
            return ""
        return RegisterRequest.validate_phone_number(value)
