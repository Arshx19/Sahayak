from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
try:
    from pydantic import BaseModel, Field, ConfigDict, model_validator
except ImportError:
    # Minimal fallback mock for environments without pydantic installed yet
    class BaseModel:
        def __init__(self, **data):
            # Populate class attribute defaults (for environments without pydantic installed)
            for cls in reversed(self.__class__.__mro__):
                for k, v in cls.__dict__.items():
                    if not k.startswith("_") and not callable(v) and not isinstance(v, (classmethod, staticmethod)):
                        # If default is a factory lambda or callable default
                        val = v() if callable(v) else v
                        setattr(self, k, val)
            if "income" in data and "annual_income" not in data:
                data["annual_income"] = data["income"]
            elif "annual_income" in data and "income" not in data:
                data["income"] = data["annual_income"]
            if "complaint" in data and "complaint_text" not in data:
                data["complaint_text"] = data["complaint"]
            elif "complaint_text" in data and "complaint" not in data:
                data["complaint"] = data["complaint_text"]
            if "code" in data and "scheme_code" not in data:
                data["scheme_code"] = data["code"]
            elif "scheme_code" in data and "code" not in data:
                data["code"] = data["scheme_code"]
            if "type" in data and "scheme_type" not in data:
                data["scheme_type"] = data["type"]
            elif "scheme_type" in data and "type" not in data:
                data["type"] = data["scheme_type"]
            if "official_source" in data and "official_url" not in data:
                data["official_url"] = data["official_source"]
            elif "official_url" in data and "official_source" not in data:
                data["official_source"] = data["official_url"]
            for k, v in data.items():
                setattr(self, k, v)
        def model_dump(self, **kwargs):
            return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}
        def dict(self, **kwargs):
            return self.model_dump(**kwargs)
    def Field(default=None, **kwargs):
        return default
    def model_validator(mode="before"):
        return lambda f: f
    ConfigDict = None


class UserRole(str, Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN = "admin"


class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    user_id: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None


class UserResponse(UserBase):
    user_id: str
    created_at: datetime
    last_login: Optional[datetime] = None


# -------------------------------------------------------------
# Citizen Profile Schemas (Shared Contract for AI & Rules Engine)
# -------------------------------------------------------------
class CitizenProfileBase(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None  # male, female, transgender, other
    occupation: Optional[str] = None  # farmer, unorganized_worker, street_vendor, daily_wage_laborer, student, unemployed, homemaker, other
    annual_income: Optional[float] = None  # in INR
    income: Optional[float] = None  # alias for annual_income
    land_acres: Optional[float] = 0.0  # Agricultural land in acres
    state: Optional[str] = None
    district: Optional[str] = None
    area_type: Optional[str] = "rural"  # rural, urban, semi-urban
    caste_category: Optional[str] = "general"  # general, obc, sc, st, minority
    is_bpl: Optional[bool] = False  # Below Poverty Line
    is_differently_abled: Optional[bool] = False
    has_girl_child: Optional[bool] = False
    girl_child_age: Optional[int] = None
    marital_status: Optional[str] = None  # single, married, widowed, divorced
    documents: List[str] = []  # List of verification documents possessed
    consent: bool = True  # Consent for government scheme matching
    raw_voice_transcript: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _sync_income_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "income" in data and ("annual_income" not in data or data["annual_income"] is None):
                data["annual_income"] = data["income"]
            elif "annual_income" in data and ("income" not in data or data["income"] is None):
                data["income"] = data["annual_income"]
        return data


class CitizenProfileCreate(CitizenProfileBase):
    pass


class CitizenProfileInDB(CitizenProfileBase):
    profile_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------
# Schemes & Deterministic Rules Schemas
# -------------------------------------------------------------
class RuleCondition(BaseModel):
    field: str  # e.g., age, annual_income, occupation, land_acres, state, is_bpl
    operator: str  # >=, <=, ==, !=, >, <, in, not_in
    value: Any  # threshold or allowed values
    explanation: str  # human-readable rule description in English
    hindi_explanation: Optional[str] = None  # human-readable rule description in Hindi


class SchemeRuleModel(BaseModel):
    scheme_id: str  # matches Scheme code/id
    version: str = "1.0"
    logic: str = "AND"  # AND / OR
    rules: List[RuleCondition] = []


class SchemeBase(BaseModel):
    scheme_code: str  # e.g. PM-KISAN, PM-JAY
    code: Optional[str] = None  # alias for scheme_code
    name: str  # full official name
    hindi_name: Optional[str] = None
    category: str  # Agriculture, Healthcare, Housing, Social Security, Employment, Financial
    scheme_type: str = "Central"  # Central or State
    type: Optional[str] = "Central"  # alias for scheme_type
    applicable_states: List[str] = ["ALL"]  # ["ALL"] or ["Uttar Pradesh", "Bihar"]
    description: str
    benefits: str
    required_documents: List[str] = []
    official_url: Optional[str] = None
    official_source: Optional[str] = None  # alias for official_url
    helpline_number: Optional[str] = None
    is_active: bool = True
    status: Optional[str] = "active"
    version: str = "1.0"
    last_verified: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _sync_scheme_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "code" in data and ("scheme_code" not in data or not data["scheme_code"]):
                data["scheme_code"] = data["code"]
            elif "scheme_code" in data and ("code" not in data or not data["code"]):
                data["code"] = data["scheme_code"]
            if "type" in data and ("scheme_type" not in data or not data["scheme_type"]):
                data["scheme_type"] = data["type"]
            elif "scheme_type" in data and ("type" not in data or not data["type"]):
                data["type"] = data["scheme_type"]
            if "official_source" in data and ("official_url" not in data or not data["official_url"]):
                data["official_url"] = data["official_source"]
            elif "official_url" in data and ("official_source" not in data or not data["official_source"]):
                data["official_source"] = data["official_url"]
        return data


class SchemeCreate(SchemeBase):
    pass


class SchemeInDB(SchemeBase):
    scheme_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------
# Eligibility Check & Audit Results
# -------------------------------------------------------------
class CriteriaResult(BaseModel):
    field: str
    passed: bool
    user_value: Any
    required_value: Any
    operator: str
    explanation: str


class EligibilityCheckRecord(BaseModel):
    check_id: Optional[str] = None
    user_id: Optional[str] = None
    scheme_id: str
    scheme_name: str
    profile_snapshot: Dict[str, Any]
    criteria_results: List[CriteriaResult]
    is_eligible: bool
    reasons: List[str] = []
    required_documents: List[str] = []
    next_steps: List[str] = []
    rule_engine_version: str = "1.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------
# Grievance Schemas
# -------------------------------------------------------------
class GrievancePriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class GrievanceStatus(str, Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class GrievanceUpdateRecord(BaseModel):
    update_id: Optional[str] = None
    previous_status: Optional[GrievanceStatus] = None
    new_status: GrievanceStatus
    comment: str
    updated_by: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GrievanceCreate(BaseModel):
    user_id: Optional[str] = None
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    scheme_id: Optional[str] = None
    scheme_name: Optional[str] = None
    intent: Optional[str] = "GENERAL_GRIEVANCE"  # e.g., Payment Delay, Application Rejection, or general before AI analysis
    complaint: Optional[str] = None  # alias for complaint_text
    complaint_text: Optional[str] = None
    priority: GrievancePriority = GrievancePriority.MEDIUM
    department: str = "General Grievance Redressal"
    voice_text: Optional[str] = None  # Original transcribed voice input

    @model_validator(mode="before")
    @classmethod
    def _sync_complaint_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "complaint" in data and ("complaint_text" not in data or not data["complaint_text"]):
                data["complaint_text"] = data["complaint"]
            elif "complaint_text" in data and ("complaint" not in data or not data["complaint"]):
                data["complaint"] = data["complaint_text"]
        return data


class GrievanceInDB(GrievanceCreate):
    ticket_id: str
    status: GrievanceStatus = GrievanceStatus.OPEN
    assigned_officer: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    timeline: List[GrievanceUpdateRecord] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------
# Audit Logs (Append-Only)
# -------------------------------------------------------------
class AuditLogRecord(BaseModel):
    log_id: Optional[str] = None
    action: str  # USER_LOGIN, PROFILE_UPDATED, ELIGIBILITY_CHECK, GRIEVANCE_CREATED, etc.
    actor_id: Optional[str] = None
    role: Optional[str] = None
    resource_type: str  # profile, scheme, grievance, auth
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
