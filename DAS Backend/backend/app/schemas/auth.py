from pydantic import BaseModel
from typing import Optional

class UserLogin(BaseModel):
    username: str
    password: str
    role: Optional[str] = None  # Accept role field but make it optional

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    session_type: Optional[str] = None

class UserUpdate(BaseModel):
    username: str
    password: Optional[str] = None  # Optional for updates
    role: str
    session_type: Optional[str] = None
    is_active: Optional[bool] = None  # Add is_active field

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PasswordReset(BaseModel):
    username: str
    role: str

class UsernameUpdate(BaseModel):
    new_username: str