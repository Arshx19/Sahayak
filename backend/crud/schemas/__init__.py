"""SAHAYAK Pydantic Schemas Package."""

from .auth import UserRegisterRequest, UserLoginRequest, TokenResponse, AuthResponse
from .user import UserResponse, UserUpdateRequest
from .profile import ProfileCreate, ProfileUpdate, ProfileResponse
from .scheme import SchemeCreate, SchemeUpdate, SchemeResponse
from .rule import RuleCreate, RuleUpdate, RuleResponse
from .document import (
    DocumentUploadRequest,
    DocumentResponse,
    DocumentListResponse,
)
from .notification import (
    NotificationCreateRequest,
    NotificationResponse,
    NotificationListResponse,
)
from .eligibility import (
    EligibilityCheckRequest,
    CriterionResult,
    EligibilityResultData,
    EligibilityResponse,
    MySchemesData,
    MySchemesResponse,
)
from .grievance import (
    GrievanceCreate,
    GrievanceStatusUpdate,
    GrievanceAssignRequest,
    GrievanceUpdateCreate,
    GrievanceResponse,
    GrievanceUpdateResponse,
)

__all__ = [
    "UserRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "AuthResponse",
    "UserResponse",
    "UserUpdateRequest",
    "ProfileCreate",
    "ProfileUpdate",
    "ProfileResponse",
    "SchemeCreate",
    "SchemeUpdate",
    "SchemeResponse",
    "RuleCreate",
    "RuleUpdate",
    "RuleResponse",
    "DocumentUploadRequest",
    "DocumentResponse",
    "DocumentListResponse",
    "NotificationCreateRequest",
    "NotificationResponse",
    "NotificationListResponse",
    "EligibilityCheckRequest",
    "CriterionResult",
    "EligibilityResultData",
    "EligibilityResponse",
    "MySchemesData",
    "MySchemesResponse",
    "GrievanceCreate",
    "GrievanceStatusUpdate",
    "GrievanceAssignRequest",
    "GrievanceUpdateCreate",
    "GrievanceResponse",
    "GrievanceUpdateResponse",
]
