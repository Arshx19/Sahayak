"""Pydantic schemas for Grievances Redressal.

Compatible with DB grievances collection and timeline tracking.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class GrievanceStatus(str, Enum):
    """Lifecycle statuses for grievances."""
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class GrievancePriority(str, Enum):
    """Priority levels for grievances."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class GrievanceCreate(BaseModel):
    """Schema for filing a grievance by a citizen."""
    user_id: Optional[str] = None
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    scheme_id: Optional[str] = Field(None, description="Related scheme ID if applicable")
    scheme_name: Optional[str] = None
    complaint: Optional[str] = Field(None, description="Citizen grievance text description")
    complaint_text: Optional[str] = Field(None, description="Alias for complaint text")
    intent: Optional[str] = Field("GENERAL_GRIEVANCE", description="AI intent classification")
    priority: Optional[GrievancePriority] = Field(GrievancePriority.MEDIUM, description="Priority score")
    department: Optional[str] = Field("General Grievance Redressal", description="Target department")
    voice_text: Optional[str] = Field(None, description="Original transcribed voice input")

    @model_validator(mode="before")
    @classmethod
    def normalize_complaint(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("complaint_text") and data.get("complaint"):
                data["complaint_text"] = data["complaint"]
            elif not data.get("complaint") and data.get("complaint_text"):
                data["complaint"] = data["complaint_text"]
        return data


class GrievanceStatusUpdate(BaseModel):
    """Schema for updating grievance status by an officer or admin."""
    status: GrievanceStatus = Field(..., description="New status")
    comment: Optional[str] = Field("Status updated by officer", description="Status update note/comment")


class GrievanceAssignRequest(BaseModel):
    """Schema for assigning grievance to an officer."""
    assigned_officer: str = Field(..., description="Officer user ID or identifier")


class GrievanceUpdateCreate(BaseModel):
    """Schema for adding progress comment or note on a ticket."""
    comment: str = Field(..., min_length=1, description="Officer progress remark or resolution detail")
    status: Optional[GrievanceStatus] = Field(None, description="Optional updated status")


class GrievanceUpdateResponse(BaseModel):
    """Schema for individual grievance progress audit update."""
    update_id: Optional[str] = None
    id: Optional[str] = None
    grievance_id: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    status: Optional[str] = None
    comment: str
    updated_by: str
    timestamp: Optional[Any] = None
    created_at: Optional[Any] = None


class GrievanceResponse(BaseModel):
    """Schema for full grievance ticket details."""
    id: Optional[str] = None
    ticket_id: str
    user_id: Optional[str] = None
    scheme_id: Optional[str] = None
    scheme_name: Optional[str] = None
    complaint: Optional[str] = None
    complaint_text: Optional[str] = None
    intent: Optional[str] = None
    priority: Optional[Any] = "MEDIUM"
    status: Optional[Any] = "OPEN"
    department: Optional[str] = None
    assigned_officer: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    timeline: List[Any] = Field(default_factory=list)
    updates: List[Any] = Field(default_factory=list)
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None
