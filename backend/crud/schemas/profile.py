"""Pydantic schemas for Citizen Profiles.

Compatible with DB citizen_profiles schema and rules engine criteria.
Kept strictly segregated from authentication credentials.
"""

from typing import Any, List, Optional
from pydantic import BaseModel, Field, model_validator


class ProfileCreate(BaseModel):
    """Schema for creating a citizen demographic and economic profile."""
    age: Optional[int] = Field(None, ge=0, le=130, description="Age in years")
    gender: Optional[str] = Field(None, description="Gender (e.g. female, male, other)")
    annual_income: Optional[float] = Field(None, ge=0.0, description="Annual household income in INR")
    income: Optional[float] = Field(None, ge=0.0, description="Alias for annual_income")
    occupation: Optional[str] = Field(None, description="Primary occupation (e.g. farmer, street_vendor, student)")
    land_acres: Optional[float] = Field(0.0, ge=0.0, description="Agricultural land holding in acres")
    state: Optional[str] = Field(None, description="Residential State")
    district: Optional[str] = Field(None, description="Residential District")
    area_type: Optional[str] = Field("rural", description="Area classification: rural, urban, semi-urban")
    caste_category: Optional[str] = Field("general", description="Category: general, obc, sc, st, minority")
    is_bpl: Optional[bool] = Field(False, description="Below Poverty Line status")
    is_differently_abled: Optional[bool] = Field(False, description="Disability status")
    has_girl_child: Optional[bool] = Field(False, description="Has at least one girl child")
    girl_child_age: Optional[int] = Field(None, description="Age of youngest girl child")
    marital_status: Optional[str] = Field(None, description="single, married, widowed, divorced")
    documents: List[str] = Field(default_factory=list, description="Possessed verification documents")
    consent: bool = Field(True, description="Citizen consent for scheme evaluation")
    raw_voice_transcript: Optional[str] = Field(None, description="Voice interaction transcript")

    @model_validator(mode="before")
    @classmethod
    def normalize_income(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "annual_income" not in data and "income" in data:
                data["annual_income"] = data["income"]
            elif "income" not in data and "annual_income" in data:
                data["income"] = data["annual_income"]
        return data


class ProfileUpdate(BaseModel):
    """Schema for updating citizen profile attributes."""
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = None
    annual_income: Optional[float] = Field(None, ge=0.0)
    income: Optional[float] = Field(None, ge=0.0)
    occupation: Optional[str] = None
    land_acres: Optional[float] = Field(None, ge=0.0)
    state: Optional[str] = None
    district: Optional[str] = None
    area_type: Optional[str] = None
    caste_category: Optional[str] = None
    is_bpl: Optional[bool] = None
    is_differently_abled: Optional[bool] = None
    has_girl_child: Optional[bool] = None
    girl_child_age: Optional[int] = None
    marital_status: Optional[str] = None
    documents: Optional[List[str]] = None
    consent: Optional[bool] = None
    raw_voice_transcript: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_income(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "annual_income" not in data and "income" in data:
                data["annual_income"] = data["income"]
            elif "income" not in data and "annual_income" in data:
                data["income"] = data["annual_income"]
        return data


class ProfileResponse(BaseModel):
    """Schema for returning citizen profile data."""
    id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    annual_income: Optional[float] = None
    income: Optional[float] = None
    occupation: Optional[str] = None
    land_acres: Optional[float] = 0.0
    state: Optional[str] = None
    district: Optional[str] = None
    area_type: Optional[str] = "rural"
    caste_category: Optional[str] = "general"
    is_bpl: Optional[bool] = False
    is_differently_abled: Optional[bool] = False
    has_girl_child: Optional[bool] = False
    girl_child_age: Optional[int] = None
    marital_status: Optional[str] = None
    documents: List[str] = Field(default_factory=list)
    consent: bool = True
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None
