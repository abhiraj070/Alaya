import re

from pydantic import BaseModel, field_validator

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
        value = value.strip()
        digits = re.sub(r"[^0-9]", "", value)
        if not re.fullmatch(r"\+?[0-9 ()-]+", value) or not 7 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number with 7 to 15 digits.")
        return value

class LoginRequest(BaseModel):
    username: str
    password: str

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
