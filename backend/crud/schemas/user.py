"""Pydantic schemas for User Management."""

from typing import Optional
from pydantic import BaseModel, Field


class UserUpdateRequest(BaseModel):
    """Schema for updating basic account data."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None)


class UserResponse(BaseModel):
    """Schema for returning user account details."""
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool = True
    created_at: Optional[str] = None
    last_login: Optional[str] = None
