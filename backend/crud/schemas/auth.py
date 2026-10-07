"""Pydantic schemas for Authentication."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class UserRegisterRequest(BaseModel):
    """Schema for user registration request."""
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: str = Field(..., description="Unique email address")
    phone: Optional[str] = Field(None, description="Citizen or officer contact number")
    password: str = Field(..., min_length=6, description="Plain text password (hashed upon receipt)")
    role: Optional[str] = Field("citizen", description="Role: citizen, officer, or admin")


class UserLoginRequest(BaseModel):
    """Schema for user login credentials."""
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    """Access token payload response."""
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class AuthResponse(BaseModel):
    """Unified response format for authentication."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
