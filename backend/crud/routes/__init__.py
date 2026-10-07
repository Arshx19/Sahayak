"""SAHAYAK API Routes Package."""

from .auth import router as auth_router
from .users import router as users_router
from .profiles import router as profiles_router
from .documents import router as documents_router
from .schemes import router as schemes_router
from .rules import router as rules_router
from .eligibility import router as eligibility_router
from .notifications import router as notifications_router
from .grievances import router as grievances_router

__all__ = [
    "auth_router",
    "users_router",
    "profiles_router",
    "documents_router",
    "schemes_router",
    "rules_router",
    "eligibility_router",
    "notifications_router",
    "grievances_router",
]
