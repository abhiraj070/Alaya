from pydantic import BaseModel

class AuthResponse(BaseModel):
    id :str
    name : str
    username : str

class RegisterRequest(BaseModel):
    name: str
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str