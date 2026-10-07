"""
FastAPI Router Helpers for SAHAYAK Database
Backend developers can directly plug this router into FastAPI main.py:
    from DB.router import db_router
    app.include_router(db_router)
Or use the endpoint implementations as references for customized routers.
"""

from typing import Any, Dict, List, Optional
try:
    from fastapi import APIRouter, Depends, HTTPException, Query, status
except ImportError:
    # Minimal fallback mock for typing / development without FastAPI installed
    class APIRouter:
        def __init__(self, *args, **kwargs): pass
        def get(self, *args, **kwargs): return lambda f: f
        def post(self, *args, **kwargs): return lambda f: f
        def put(self, *args, **kwargs): return lambda f: f
        def delete(self, *args, **kwargs): return lambda f: f
    def Depends(f): return None
    class HTTPException(Exception): pass
    def Query(default=None, **kwargs): return default
    class status:
        HTTP_201_CREATED = 201
        HTTP_404_NOT_FOUND = 404
        HTTP_400_BAD_REQUEST = 400

from .connection import get_db, ping_database
from . import crud
from .schemas import (
    CitizenProfileCreate,
    GrievanceCreate,
    SchemeCreate,
)

db_router = APIRouter(prefix="/api", tags=["Database Services"])


# -----------------------------------------------------------------------------
# Health Check Endpoint
# -----------------------------------------------------------------------------
@db_router.get("/db/health", summary="Check MongoDB Connection Health")
async def health_check():
    """Verify live connectivity to MongoDB."""
    return await ping_database()


# -----------------------------------------------------------------------------
# Schemes Endpoints
# -----------------------------------------------------------------------------
@db_router.get("/schemes", summary="List All Active Government Schemes")
async def list_schemes(
    category: Optional[str] = Query(None, description="Filter schemes by category (e.g. Agriculture, Healthcare)"),
    db = Depends(get_db),
):
    """Fetch all seeded government schemes with details and required documents."""
    return await crud.get_all_schemes(db, category=category, is_active=True)


@db_router.get("/schemes/{scheme_id}", summary="Get Government Scheme Details")
async def get_scheme(scheme_id: str, db = Depends(get_db)):
    """Fetch details for a single government scheme by ID or code (e.g. 'pm_kisan' or 'PM-KISAN')."""
    scheme = await crud.get_scheme_by_id(db, scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found")
    return scheme


@db_router.get("/schemes/{scheme_id}/rules", summary="Get Scheme Eligibility Rules")
async def get_rules(scheme_id: str, db = Depends(get_db)):
    """Fetch deterministic eligibility rules for the Rules Engine."""
    rules = await crud.get_scheme_rules(db, scheme_id)
    if not rules:
        raise HTTPException(status_code=404, detail=f"Rules for scheme '{scheme_id}' not found")
    return rules


@db_router.get("/rules", summary="Get All Eligibility Rules (Batch)")
async def get_all_rules(db = Depends(get_db)):
    """Fetch rules for all schemes for bulk evaluation."""
    return await crud.get_all_scheme_rules(db)


# -----------------------------------------------------------------------------
# Citizen Profile Endpoints
# -----------------------------------------------------------------------------
@db_router.get("/profiles/{user_id}", summary="Get Citizen Profile")
async def get_profile(user_id: str, db = Depends(get_db)):
    """Fetch profile parameters (age, income, land, occupation, etc.)."""
    profile = await crud.get_citizen_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile for user '{user_id}' not found")
    return profile


@db_router.post("/profiles/{user_id}", summary="Create or Update Citizen Profile")
async def update_profile(
    user_id: str,
    profile_data: CitizenProfileCreate,
    db = Depends(get_db),
):
    """Save profile parameters extracted from voice or submitted by user."""
    data = profile_data.model_dump() if hasattr(profile_data, "model_dump") else profile_data.dict()
    return await crud.upsert_citizen_profile(db, user_id, data)


# -----------------------------------------------------------------------------
# Eligibility Check History
# -----------------------------------------------------------------------------
@db_router.post("/eligibility/history", summary="Save Eligibility Check Result")
async def record_eligibility(
    check_result: Dict[str, Any],
    db = Depends(get_db),
):
    """Persist eligibility result and criteria breakdown for auditable explanation."""
    return await crud.save_eligibility_check(db, check_result)


@db_router.get("/eligibility/history/{user_id}", summary="Get Citizen Eligibility History")
async def get_eligibility_history(user_id: str, db = Depends(get_db)):
    """Get previous scheme eligibility checks for a citizen."""
    return await crud.get_user_eligibility_history(db, user_id)


# -----------------------------------------------------------------------------
# Grievance Endpoints
# -----------------------------------------------------------------------------
@db_router.post("/grievances", summary="Create Grievance Ticket")
async def create_new_grievance(
    grievance: GrievanceCreate,
    db = Depends(get_db),
):
    """Submit a grievance extracted via voice AI or manual input."""
    data = grievance.model_dump() if hasattr(grievance, "model_dump") else grievance.dict()
    return await crud.create_grievance(db, data)


@db_router.get("/grievances/ticket/{ticket_id}", summary="Get Grievance by Ticket ID")
async def get_grievance(ticket_id: str, db = Depends(get_db)):
    """Lookup grievance status and timeline by ticket ID."""
    doc = await crud.get_grievance_by_ticket_id(db, ticket_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found")
    return doc


@db_router.get("/grievances/user/{user_id}", summary="List Citizen Grievances")
async def get_user_grievances(user_id: str, db = Depends(get_db)):
    """List all grievances filed by a citizen."""
    return await crud.get_user_grievances(db, user_id)


# -----------------------------------------------------------------------------
# Officer Dashboard Endpoints
# -----------------------------------------------------------------------------
@db_router.get("/officer/dashboard", summary="Officer Dashboard Analytics")
async def officer_dashboard(db = Depends(get_db)):
    """Return key metrics: total queries, open grievances, pending, resolved, department breakdown."""
    return await crud.get_officer_dashboard_stats(db)


@db_router.get("/officer/grievances", summary="Officer Grievance List with Filters")
async def list_officer_grievances(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, IN_PROGRESS, RESOLVED, etc."),
    department: Optional[str] = Query(None, description="Filter by department"),
    db = Depends(get_db),
):
    """Retrieve grievances for officer handling."""
    return await crud.get_all_grievances(db, status=status, department=department)


@db_router.put("/officer/grievances/{ticket_id}/status", summary="Update Grievance Status")
async def update_status(
    ticket_id: str,
    new_status: str = Query(..., description="New status (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED)"),
    comment: str = Query(..., description="Officer comment / update explanation"),
    officer_id: str = Query("officer_admin", description="ID or name of officer updating ticket"),
    db = Depends(get_db),
):
    """Update grievance status and append entry to the ticket timeline."""
    updated = await crud.update_grievance_status(
        db, ticket_id=ticket_id, new_status=new_status, comment=comment, updated_by=officer_id
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found")
    return updated
