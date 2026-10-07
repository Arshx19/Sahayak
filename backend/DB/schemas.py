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


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    is_active: bool = True
    status: Optional[str] = "active"
    state: Optional[str] = None
    district: Optional[str] = None


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
# User Documents Schemas (Document-Centric Architecture)
# -------------------------------------------------------------
class DocumentVerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class UserDocumentBase(BaseModel):
    document_type: str  # e.g., "aadhaar", "pan", "income_certificate", "caste_certificate", extensible
    document_name: Optional[str] = None  # Human-readable title
    document_number: Optional[str] = None  # Masked or normalized doc number
    file_url: Optional[str] = None  # Reference/storage URL or path
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    verification_status: DocumentVerificationStatus = DocumentVerificationStatus.PENDING
    status: Optional[str] = "active"  # active, archived, replaced
    expiry_date: Optional[str] = None  # ISO format string or None
    metadata: Dict[str, Any] = Field(default_factory=dict)  # Flexible custom metadata (state, issuing authority, etc.)


class UserDocumentCreate(UserDocumentBase):
    user_id: Optional[str] = None


class UserDocumentUpdate(BaseModel):
    document_name: Optional[str] = None
    document_number: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    verification_status: Optional[DocumentVerificationStatus] = None
    status: Optional[str] = None
    expiry_date: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UserDocumentInDB(UserDocumentBase):
    document_id: str
    user_id: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserDocumentResponse(UserDocumentBase):
    document_id: str
    user_id: str
    uploaded_at: datetime
    updated_at: datetime


# -------------------------------------------------------------
# Citizen Profile Schemas (Deprecated / Maintained for Demographic Rules & Backward Compatibility)
# Note: Citizen documents are now managed primarily via UserDocument models in `user_documents`.
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
    raw_voice_transcript: Optional[str] = None  # Deprecated: retained for backwards compatibility

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
# Schemes & Deterministic Rules Schemas (Prepared for Excel Ingestion)
# -------------------------------------------------------------
class RuleCondition(BaseModel):
    field: str  # e.g., age, annual_income, occupation, land_acres, state, documents, is_bpl
    operator: str  # >=, <=, ==, !=, >, <, in, not_in, contains, has_document
    value: Any  # threshold, allowed values, or required document type
    explanation: str  # human-readable rule description in English
    hindi_explanation: Optional[str] = None  # human-readable rule description in Hindi


class SchemeRuleModel(BaseModel):
    scheme_id: str  # matches Scheme code/id
    version: str = "1.0"
    logic: str = "AND"  # AND / OR
    rules: List[RuleCondition] = []


class SchemeBase(BaseModel):
    scheme_id: Optional[str] = None  # e.g. "CEN001", "UP001", "pm_kisan"
    scheme_code: str = ""  # e.g. "PM-KISAN", "PM-JAY", "CEN001"
    code: Optional[str] = None  # alias for scheme_code
    scheme_name: Optional[str] = None  # Excel field name alias for name
    name: str = ""  # full official name
    hindi_name: Optional[str] = None
    category: str = "General"  # Agriculture, Healthcare, Housing, Farmer, Women, etc.
    scheme_category: Optional[str] = None  # Excel field alias for category
    scheme_type: str = "Central"  # Central or State
    type: Optional[str] = "Central"  # alias for scheme_type
    provider: str = "Central"  # "Central", "State", or "Centre + State"
    state: Optional[str] = None  # State name (e.g. "Uttar Pradesh", "All India")
    applicable_states: List[str] = ["ALL"]  # ["ALL"] or ["Uttar Pradesh", "Bihar"]
    description: str = ""
    benefits: Optional[str] = ""
    eligibility: Optional[str] = None  # Human-readable eligibility requirement statement from Excel
    required_documents: List[str] = []  # e.g. ["aadhaar", "pan", "income_certificate", "land_record"]
    raw_required_documents: Optional[str] = None  # Original pipe-delimited string from Excel if imported
    timeline: Dict[str, Any] = Field(default_factory=dict)  # application period, start/end dates, validity
    application_start: Optional[str] = None  # Excel field
    application_end: Optional[str] = None  # Excel field
    application_frequency: Optional[str] = None  # Continuous, Annual, Periodic
    application_status: Optional[str] = None  # Open, Closed, Continuous, Upcoming
    application_process: Optional[str] = None  # Short step-by-step application walkthrough
    application_url: Optional[str] = None  # Official citizen portal
    official_url: Optional[str] = None
    official_source: Optional[str] = None  # alias for official_url
    helpline_number: Optional[str] = None
    is_active: bool = True
    status: Optional[str] = "active"
    version: str = "1.0"
    last_verified: Optional[str] = None
    change_summary: Optional[str] = None  # Admin change log note

    @model_validator(mode="before")
    @classmethod
    def _sync_scheme_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Sync name <-> scheme_name
            if "scheme_name" in data and ("name" not in data or not data["name"]):
                data["name"] = data["scheme_name"]
            elif "name" in data and ("scheme_name" not in data or not data["scheme_name"]):
                data["scheme_name"] = data["name"]

            # Sync category <-> scheme_category
            if "scheme_category" in data and ("category" not in data or not data["category"]):
                data["category"] = data["scheme_category"]
            elif "category" in data and ("scheme_category" not in data or not data["scheme_category"]):
                data["scheme_category"] = data["category"]

            # Sync code <-> scheme_code <-> scheme_id
            if "code" in data and ("scheme_code" not in data or not data["scheme_code"]):
                data["scheme_code"] = data["code"]
            elif "scheme_code" in data and ("code" not in data or not data["code"]):
                data["code"] = data["scheme_code"]
            if not data.get("scheme_code") and data.get("scheme_id"):
                data["scheme_code"] = data["scheme_id"]
                data["code"] = data["scheme_id"]

            # Sync scheme_type <-> type <-> provider
            if "type" in data and ("scheme_type" not in data or not data["scheme_type"]):
                data["scheme_type"] = data["type"]
            elif "scheme_type" in data and ("type" not in data or not data["type"]):
                data["type"] = data["scheme_type"]
            if "provider" in data and not data.get("scheme_type"):
                data["scheme_type"] = data["provider"]
                data["type"] = data["provider"]

            # Sync URLs
            if "official_source" in data and ("official_url" not in data or not data["official_url"]):
                data["official_url"] = data["official_source"]
            elif "official_url" in data and ("official_source" not in data or not data["official_source"]):
                data["official_source"] = data["official_url"]
            if "application_url" in data and ("official_url" not in data or not data["official_url"]):
                data["official_url"] = data["application_url"]

            # Sync state -> applicable_states
            if "state" in data and data["state"]:
                st = str(data["state"]).strip()
                if st.lower() in ("all india", "all", "central"):
                    data["applicable_states"] = ["ALL"]
                elif "applicable_states" not in data or data["applicable_states"] == ["ALL"]:
                    data["applicable_states"] = [st]

            # Sync timeline dict with individual Excel timeline fields
            if "timeline" not in data or not data["timeline"]:
                t = {}
                if data.get("application_start"):
                    t["application_start"] = data["application_start"]
                if data.get("application_end"):
                    t["application_end"] = data["application_end"]
                if data.get("application_frequency"):
                    t["application_frequency"] = data["application_frequency"]
                if data.get("application_status"):
                    t["application_status"] = data["application_status"]
                data["timeline"] = t
        return data


class SchemeCreate(SchemeBase):
    pass


class SchemeInDB(SchemeBase):
    scheme_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------
# Eligibility Check & Audit Results (Explainable Failure Models)
# -------------------------------------------------------------
class CriteriaResult(BaseModel):
    criterion: Optional[str] = None  # Identifier e.g. "PAN_CARD", "OCCUPATION", "STATE"
    field: str
    passed: bool
    status: str = "passed"  # "passed", "failed", "missing"
    user_value: Any = None
    required_value: Any = None
    operator: str = "=="
    reason: Optional[str] = None  # Clear human-readable reason why failed/passed
    explanation: str = ""  # Rule description
    expected: Any = None
    actual: Any = None

    @model_validator(mode="before")
    @classmethod
    def _sync_criteria_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "criterion" not in data or not data["criterion"]:
                data["criterion"] = data.get("field", "")
            if "expected" not in data and "required_value" in data:
                data["expected"] = data["required_value"]
            if "actual" not in data and "user_value" in data:
                data["actual"] = data["user_value"]
            if "reason" not in data or not data["reason"]:
                data["reason"] = data.get("explanation", "")
        return data


class EligibilityCheckRecord(BaseModel):
    check_id: Optional[str] = None
    user_id: Optional[str] = None
    scheme_id: str
    scheme_name: str
    profile_snapshot: Dict[str, Any] = Field(default_factory=dict)
    documents_snapshot: List[str] = Field(default_factory=list)  # List of verified document types possessed
    criteria_results: List[CriteriaResult] = Field(default_factory=list)
    is_eligible: bool
    reasons: List[str] = []
    missing_documents: List[str] = []
    required_documents: List[str] = []
    next_steps: List[str] = []
    rule_engine_version: str = "1.0"
    scheme_version: str = "1.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------
# User Notification Schemas
# -------------------------------------------------------------
class NotificationType(str, Enum):
    SCHEME_NEW = "SCHEME_NEW"
    SCHEME_UPDATED = "SCHEME_UPDATED"
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"
    DOCUMENT_REJECTED = "DOCUMENT_REJECTED"
    ELIGIBILITY_CHANGED = "ELIGIBILITY_CHANGED"
    GENERAL = "GENERAL"


class NotificationBase(BaseModel):
    user_id: str
    scheme_id: Optional[str] = None
    notification_type: NotificationType = NotificationType.GENERAL
    title: str
    message: str
    is_read: bool = False
    context: Dict[str, Any] = Field(default_factory=dict)


class NotificationCreate(NotificationBase):
    pass


class NotificationInDB(NotificationBase):
    notification_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read_at: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    notification_id: str
    created_at: datetime
    read_at: Optional[datetime] = None


# -------------------------------------------------------------
# Grievance Schemas (Deferred / Maintained for Existing CRUD Routes)
# Note: Grievance workflow is marked TBD in product specification.
# Retained intact to prevent breaking backend/crud routes until grievance spec is defined.
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
