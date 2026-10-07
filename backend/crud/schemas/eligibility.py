"""Pydantic schemas for Scheme Eligibility Verification."""

from typing import Any, Dict, List, Optional
from datetime import datetime
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
    field: str = Field(..., description="Field evaluated (e.g. 'age', 'income', 'aadhaar')")
    criterion: Optional[str] = Field(None, description="Criterion key name")
    required: Optional[str] = Field(None, description="Rule requirement string (e.g. '>= 18')")
    actual: Optional[Any] = Field(None, description="Actual citizen attribute value")
    passed: bool = Field(..., description="Whether the condition was satisfied")
    status: Optional[str] = Field("passed", description="'passed', 'failed', or 'missing'")
    reason: Optional[str] = Field(None, description="Human-readable reason for criterion status")
    explanation: Optional[str] = Field(None, description="Rule description")
    expected: Optional[Any] = None
    operator: Optional[str] = "=="


class EligibilityResultData(BaseModel):
    """Detailed explainable eligibility outcome matching frontend checklist."""
    check_id: Optional[str] = None
    scheme: Optional[str] = Field(None, description="Scheme name or code")
    scheme_id: str = Field(..., description="Scheme unique identifier")
    scheme_name: Optional[str] = Field(None, description="Full scheme official title")
    is_eligible: bool = Field(..., description="Final deterministic eligibility outcome")
    eligible: Optional[bool] = Field(None, description="Alias for is_eligible")
    criteria: List[CriterionResult] = Field(default_factory=list, description="Breakdown of each rule check")
    criteria_results: List[CriterionResult] = Field(default_factory=list, description="Breakdown of criteria results")
    reasons: List[str] = Field(default_factory=list, description="List of reasons for outcome")
    missing_documents: List[str] = Field(default_factory=list, description="List of required documents missing")
    required_documents: List[str] = Field(default_factory=list, description="All required documents")
    explanation: str = Field("", description="Citizen-friendly explanation of the outcome")
    profile_snapshot: Dict[str, Any] = Field(default_factory=dict)
    documents_snapshot: List[str] = Field(default_factory=list)
    timestamp: Optional[Any] = None


class EligibilityResponse(BaseModel):
    """Standardized API response for eligibility checks."""
    success: bool = True
    data: EligibilityResultData


class MySchemesData(BaseModel):
    """Eligible and ineligible schemes for citizen."""
    eligible: List[Dict[str, Any]] = Field(default_factory=list)
    ineligible: List[Dict[str, Any]] = Field(default_factory=list)


class MySchemesResponse(BaseModel):
    """Standardized API response for /eligibility/my-schemes."""
    success: bool = True
    data: MySchemesData
