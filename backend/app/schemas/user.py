from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re
from ..services.auth_service import validate_password_strength, normalize_email, normalize_username


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone: str = ""

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username_field(cls, v):
        if not isinstance(v, str):
            raise ValueError("Username is required")
        username = normalize_username(v)
        if not username:
            raise ValueError("Username is required")
        return username

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email_field(cls, v):
        if not isinstance(v, str):
            raise ValueError("Email is required")
        email = normalize_email(v)
        if not email:
            raise ValueError("Email is required")
        return email

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not isinstance(v, str) or not v:
            raise ValueError("Password is required")
        return validate_password_strength(v)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if not v:
            return ""
        return re.sub(r"\D", "", v)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email_field(cls, v):
        if v is None or v == "":
            return v
        if not isinstance(v, str):
            raise ValueError("Email is invalid")
        return normalize_email(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if v is None or v == "":
            return v
        if not isinstance(v, str):
            raise ValueError("Password is invalid")
        return validate_password_strength(v)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v is None or v == "":
            return v
        return re.sub(r"\D", "", v)


class UserLogin(BaseModel):
    username: str
    password: str

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username_field(cls, v):
        if not isinstance(v, str):
            raise ValueError("Username is required")
        username = normalize_username(v)
        if not username:
            raise ValueError("Username is required")
        return username


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    phone: str
    is_staff: bool
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
