"""Pydantic schemas for Scheme Eligibility Rules."""

from typing import Any, Optional
from pydantic import BaseModel, Field


class RuleCreate(BaseModel):
    """Schema for adding an eligibility rule to a scheme (Admin only)."""
    field: str = Field(..., description="Citizen profile field evaluated (e.g., 'age', 'income', 'land_acres')")
    operator: str = Field(..., description="Comparison operator (e.g., '>=', '<=', '==', 'in', '!=')")
    value: Any = Field(..., description="Threshold or target value for the condition")
    logic: str = Field("AND", description="Boolean evaluation logic (e.g., 'AND', 'OR')")
    explanation: str = Field(..., description="Human-readable explanation of this requirement")
    version: str = Field("1.0", description="Rule specification version")


class RuleUpdate(BaseModel):
    """Schema for updating an eligibility rule (Admin only)."""
    field: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[Any] = None
    logic: Optional[str] = None
    explanation: Optional[str] = None
    version: Optional[str] = None


class RuleResponse(BaseModel):
    """Schema for returning rule details."""
    id: Optional[str] = None
    scheme_id: Optional[str] = None
    field: str
    operator: str
    value: Any
    logic: str
    explanation: str
    version: str
