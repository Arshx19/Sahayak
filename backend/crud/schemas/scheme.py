"""Pydantic schemas for Government Schemes.

Compatible with DB schemes collection and seed data contracts.
"""

from typing import Any, List, Optional
from pydantic import BaseModel, Field, model_validator


class SchemeCreate(BaseModel):
    """Schema for creating a new government scheme (Admin only)."""
    scheme_code: str = Field(..., description="Unique scheme identifier code (e.g., PM-KISAN)")
    code: Optional[str] = Field(None, description="Alias for scheme_code")
    name: str = Field(..., description="Full official name of the scheme")
    hindi_name: Optional[str] = Field(None, description="Official Hindi title")
    description: str = Field(..., description="Overview and objective of the scheme")
    category: str = Field(..., description="Sector/Category (e.g. Agriculture, Healthcare, Housing)")
    scheme_type: str = Field("Central", description="Scheme level: 'Central' or 'State'")
    type: Optional[str] = Field(None, description="Alias for scheme_type")
    applicable_states: List[str] = Field(default_factory=lambda: ["ALL"], description="List of eligible states or ['ALL']")
    benefits: str = Field(..., description="Financial or non-financial benefits provided")
    required_documents: List[str] = Field(default_factory=list, description="Necessary verification documents")
    official_url: Optional[str] = Field(None, description="Official portal URL")
    official_source: Optional[str] = Field(None, description="Alias for official_url")
    helpline_number: Optional[str] = Field(None, description="Helpline contact number")
    is_active: bool = Field(True, description="Whether the scheme is currently active")
    status: Optional[str] = Field("active", description="Status string: active / inactive")
    version: str = Field("1.0", description="Scheme specification version")
    last_verified: Optional[str] = Field(None, description="ISO timestamp of last verification")

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "scheme_code" not in data and "code" in data:
                data["scheme_code"] = data["code"]
            if "scheme_type" not in data and "type" in data:
                data["scheme_type"] = data["type"]
            if "official_url" not in data and "official_source" in data:
                data["official_url"] = data["official_source"]
        return data


class SchemeUpdate(BaseModel):
    """Schema for updating an existing government scheme (Admin only)."""
    scheme_code: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    hindi_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    scheme_type: Optional[str] = None
    type: Optional[str] = None
    applicable_states: Optional[List[str]] = None
    benefits: Optional[str] = None
    required_documents: Optional[List[str]] = None
    official_url: Optional[str] = None
    official_source: Optional[str] = None
    helpline_number: Optional[str] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None
    version: Optional[str] = None
    last_verified: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "scheme_code" not in data and "code" in data:
                data["scheme_code"] = data["code"]
            if "scheme_type" not in data and "type" in data:
                data["scheme_type"] = data["type"]
            if "official_url" not in data and "official_source" in data:
                data["official_url"] = data["official_source"]
        return data


class SchemeResponse(BaseModel):
    """Schema for scheme details response."""
    id: Optional[str] = None
    scheme_id: Optional[str] = None
    scheme_code: Optional[str] = None
    code: Optional[str] = None
    name: str
    hindi_name: Optional[str] = None
    description: str
    category: str
    scheme_type: Optional[str] = "Central"
    type: Optional[str] = "Central"
    applicable_states: List[str] = Field(default_factory=lambda: ["ALL"])
    benefits: str
    required_documents: List[str] = Field(default_factory=list)
    official_url: Optional[str] = None
    official_source: Optional[str] = None
    helpline_number: Optional[str] = None
    is_active: bool = True
    status: Optional[str] = "active"
    version: str = "1.0"
    last_verified: Optional[str] = None
