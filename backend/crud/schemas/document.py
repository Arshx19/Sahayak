"""Pydantic schemas for Citizen Document Locker."""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class DocumentUploadRequest(BaseModel):
    """Schema for citizen document upload / registration."""
    document_type: str = Field(..., description="Document type identifier or alias (e.g. aadhaar, income_cert)")
    document_name: Optional[str] = Field(None, description="Human-readable title for the document")
    document_number: Optional[str] = Field(None, description="Masked or sanitized document record number")
    file_name: Optional[str] = Field(None, description="File name of uploaded document")
    file_url: Optional[str] = Field(None, description="Storage URL or local reference path")
    verification_status: Optional[str] = Field("verified", description="Document verification state: verified, pending, rejected")
    status: Optional[str] = Field("active", description="active, archived, or replaced")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom metadata attributes")


class DocumentResponse(BaseModel):
    """Schema for individual user document record."""
    document_id: str
    user_id: Optional[str] = None
    document_type: str
    document_name: Optional[str] = None
    document_number: Optional[str] = None
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    verification_status: str = "verified"
    status: Optional[str] = "active"
    uploaded_at: Optional[Any] = None
    updated_at: Optional[Any] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentListResponse(BaseModel):
    """Response envelope for documents list."""
    success: bool = True
    data: List[DocumentResponse]
