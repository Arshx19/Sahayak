"""Pydantic schemas for In-App User Notifications."""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class NotificationCreateRequest(BaseModel):
    """Schema for internal notification generation."""
    scheme_id: Optional[str] = None
    notification_type: str = Field("GENERAL", description="Notification category")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification body message")
    context: Dict[str, Any] = Field(default_factory=dict)


class NotificationResponse(BaseModel):
    """Schema for individual user notification."""
    notification_id: str
    user_id: str
    scheme_id: Optional[str] = None
    notification_type: str = "GENERAL"
    title: str
    message: str
    is_read: bool = False
    context: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[Any] = None
    read_at: Optional[Any] = None


class NotificationListResponse(BaseModel):
    """Response envelope for user notifications."""
    success: bool = True
    data: List[NotificationResponse]
