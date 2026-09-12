from pydantic import BaseModel

class AuthResponse(BaseModel):
    id :int
    name : str
    username : str

class RegisterRequest(BaseModel):
    name: str
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserUpdateRequest(BaseModel):
    name: str
    username: str
