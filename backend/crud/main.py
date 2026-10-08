"""SAHAYAK - CRUD / API Service.

FastAPI application providing the core REST API layer for:
- Authentication & JWT issuance (/auth)
- User account self-service (/users)
- Citizen demographic profiles (/profile)
- Citizen digital document locker (/documents)
- Government scheme directory & rules (/schemes, /rules)
- Deterministic scheme eligibility verification (/eligibility)
- In-app citizen notifications hub (/notifications)
- Grievance registration & officer resolution workflow (/grievances)
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncGenerator, Dict

# Ensure both 'backend/' and 'backend/crud/' are in sys.path
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from DB.connection import close_connections, ping_database

# Router imports (supports both top-level and package executions)
try:
    from routes.auth import router as auth_router
    from routes.users import router as users_router
    from routes.profiles import router as profiles_router
    from routes.documents import router as documents_router
    from routes.schemes import router as schemes_router
    from routes.rules import router as rules_router
    from routes.eligibility import router as eligibility_router
    from routes.notifications import router as notifications_router
    from routes.grievances import router as grievances_router
except ImportError:
    from crud.routes.auth import router as auth_router
    from crud.routes.users import router as users_router
    from crud.routes.profiles import router as profiles_router
    from crud.routes.documents import router as documents_router
    from crud.routes.schemes import router as schemes_router
    from crud.routes.rules import router as rules_router
    from crud.routes.eligibility import router as eligibility_router
    from crud.routes.notifications import router as notifications_router
    from crud.routes.grievances import router as grievances_router


# =============================================================================
# LIFESPAN CONTEXT MANAGER
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Gracefully manage startup connection verification and shutdown cleanup."""
    # Yield control to the application
    yield
    # Shutdown: close open database client connections
    try:
        close_connections()
    except Exception:
        pass


# =============================================================================
# APPLICATION INITIALIZATION
# =============================================================================
app = FastAPI(
    title="SAHAYAK API",
    description=(
        "Voice-First AI Assistant for Government Scheme Eligibility and Grievance Assistance.\n\n"
        "**CRUD/API Layer**: Orchestrates authentication, citizen document locker, "
        "scheme directory, deterministic eligibility verification, notifications, and grievances."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# =============================================================================
# CORS MIDDLEWARE
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# EXCEPTION HANDLERS (Consistent JSON error responses)
# =============================================================================
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    error_messages = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation error: " + "; ".join(error_messages),
        },
    )


# =============================================================================
# ROUTER REGISTRATION
# =============================================================================
# 1. Authentication (/auth)
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

# 2. Users self-service (/users)
app.include_router(users_router, prefix="/users", tags=["Users"])

# 3. Citizen Profiles (/profile)
app.include_router(profiles_router, prefix="/profile", tags=["Profiles"])

# 4. Citizen Document Locker (/documents)
app.include_router(documents_router, prefix="/documents", tags=["Documents"])

# 5. Government Schemes (/schemes)
app.include_router(schemes_router, prefix="/schemes", tags=["Schemes"])

# 6. Scheme Rules (mounts /schemes/{scheme_id}/rules and /rules/{rule_id})
app.include_router(rules_router, tags=["Rules"])

# 7. Eligibility Deterministic Verification (/eligibility)
app.include_router(eligibility_router, prefix="/eligibility", tags=["Eligibility"])

# 8. User Notifications Hub (/notifications)
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

# 9. Grievances Redressal (/grievances)
app.include_router(grievances_router, prefix="/grievances", tags=["Grievances"])


# =============================================================================
# ROOT & HEALTH CHECK ENDPOINTS
# =============================================================================
@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    tags=["Root"],
    summary="Health check and service status",
)
async def root() -> Dict[str, Any]:
    """Root health endpoint verifying that the SAHAYAK CRUD/API service is live."""
    return {
        "success": True,
        "message": "SAHAYAK CRUD/API service is running",
        "version": "1.0.0",
        "documentation": "/docs",
    }


@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["Root"],
    summary="Lightweight liveness probe",
)
async def health_check() -> Dict[str, Any]:
    """Liveness probe for orchestration and load balancers."""
    return {
        "status": "healthy",
        "service": "sahayak-crud-api",
    }
