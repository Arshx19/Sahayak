"""Pydantic schemas for Scheme Eligibility Verification."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EligibilityCheckRequest(BaseModel):
    """Schema for requesting scheme eligibility verification."""
    scheme_id: str = Field(..., description="ID or code of the scheme to verify against")
    profile_override: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional temporary demographic overrides for hypothetical checking",
    )


class CriterionResult(BaseModel):
    """Evaluation result for an individual eligibility rule criterion."""
    field: str = Field(..., description="Field evaluated (e.g. 'age')")
    required: str = Field(..., description="Rule requirement string (e.g. '>= 60')")
    actual: Any = Field(..., description="Actual citizen attribute value")
    passed: bool = Field(..., description="Whether the condition was satisfied")


class EligibilityResultData(BaseModel):
    """Detailed explainable eligibility outcome."""
    scheme: str = Field(..., description="Scheme name or code")
    eligible: bool = Field(..., description="Final deterministic eligibility outcome")
    criteria: List[CriterionResult] = Field(default_factory=list, description="Breakdown of each rule check")
    explanation: str = Field(..., description="Citizen-friendly explanation of the outcome")


class EligibilityResponse(BaseModel):
    """Standardized API response for eligibility checks."""
    success: bool = True
    data: EligibilityResultData
