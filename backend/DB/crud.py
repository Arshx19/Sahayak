"""
Async CRUD Operations & Repository Helpers for SAHAYAK
Provides high-level async functions for Backend and AI pipelines to interact with MongoDB.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from .config import (
    COLLECTION_USERS,
    COLLECTION_CITIZEN_PROFILES,
    COLLECTION_SCHEMES,
    COLLECTION_SCHEME_RULES,
    COLLECTION_ELIGIBILITY_CHECKS,
    COLLECTION_GRIEVANCES,
    COLLECTION_AUDIT_LOGS,
)


def _serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Helper to convert MongoDB _id to string and clean document for API serialization."""
    if not doc:
        return None
    res = dict(doc)
    if "_id" in res:
        res["id"] = str(res["_id"])
        del res["_id"]
    return res


def _serialize_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Serialize a list of MongoDB documents."""
    return [_serialize_doc(d) for d in docs if d]


# ============================================================================
# Schemes & Rules Repositories
# ============================================================================

async def get_all_schemes(
    db, category: Optional[str] = None, is_active: bool = True
) -> List[Dict[str, Any]]:
    """Retrieve all schemes matching active status and optional category."""
    query: Dict[str, Any] = {"is_active": is_active}
    if category:
        query["category"] = category
    cursor = db[COLLECTION_SCHEMES].find(query)
    docs = await cursor.to_list(length=100)
    return _serialize_list(docs)


async def get_scheme_by_id(db, scheme_id: str) -> Optional[Dict[str, Any]]:
    """Get a single scheme by scheme_id or scheme_code."""
    doc = await db[COLLECTION_SCHEMES].find_one(
        {"$or": [{"scheme_id": scheme_id}, {"scheme_code": scheme_id}]}
    )
    return _serialize_doc(doc)


async def get_scheme_rules(db, scheme_id: str) -> Optional[Dict[str, Any]]:
    """Fetch deterministic eligibility rules for a specific scheme."""
    doc = await db[COLLECTION_SCHEME_RULES].find_one({"scheme_id": scheme_id})
    return _serialize_doc(doc)


async def get_all_scheme_rules(db) -> List[Dict[str, Any]]:
    """Fetch rules for all schemes (used by batch rules engine)."""
    cursor = db[COLLECTION_SCHEME_RULES].find()
    docs = await cursor.to_list(length=100)
    return _serialize_list(docs)


async def create_or_update_scheme(db, scheme_data: Dict[str, Any]) -> Dict[str, Any]:
    """Admin function to create or update a government scheme."""
    now = datetime.now(timezone.utc)
    scheme_id = scheme_data.get("scheme_id") or scheme_data.get("scheme_code", "").lower().replace("-", "_")
    scheme_data["scheme_id"] = scheme_id
    scheme_data["updated_at"] = now

    await db[COLLECTION_SCHEMES].update_one(
        {"scheme_id": scheme_id},
        {"$set": scheme_data, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return await get_scheme_by_id(db, scheme_id)  # type: ignore


# ============================================================================
# Citizen Profiles Repositories (Used by AI Extraction & User Profile)
# ============================================================================

async def get_citizen_profile(db, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve citizen profile for a given user_id."""
    doc = await db[COLLECTION_CITIZEN_PROFILES].find_one({"user_id": user_id})
    return _serialize_doc(doc)


async def upsert_citizen_profile(db, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save or update citizen profile (extracted by AI or submitted by user).
    """
    now = datetime.now(timezone.utc)
    profile_data["user_id"] = user_id
    profile_data["updated_at"] = now

    await db[COLLECTION_CITIZEN_PROFILES].update_one(
        {"user_id": user_id},
        {
            "$set": profile_data,
            "$setOnInsert": {
                "profile_id": f"prof_{uuid.uuid4().hex[:10]}",
                "created_at": now,
            },
        },
        upsert=True,
    )
    updated = await db[COLLECTION_CITIZEN_PROFILES].find_one({"user_id": user_id})
    return _serialize_doc(updated)  # type: ignore


# ============================================================================
# Eligibility Checks Repositories
# ============================================================================

async def save_eligibility_check(db, check_data: Dict[str, Any]) -> Dict[str, Any]:
    """Store an eligibility evaluation result with snapshot for auditability."""
    now = datetime.now(timezone.utc)
    doc = dict(check_data)
    if "check_id" not in doc or not doc["check_id"]:
        doc["check_id"] = f"chk_{uuid.uuid4().hex[:12]}"
    doc["timestamp"] = now

    await db[COLLECTION_ELIGIBILITY_CHECKS].insert_one(doc)
    return _serialize_doc(doc)  # type: ignore


async def get_user_eligibility_history(
    db, user_id: str, limit: int = 20
) -> List[Dict[str, Any]]:
    """Fetch history of eligibility checks performed by a citizen."""
    cursor = (
        db[COLLECTION_ELIGIBILITY_CHECKS]
        .find({"user_id": user_id})
        .sort("timestamp", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return _serialize_list(docs)


# ============================================================================
# Grievances & Officer Dashboard Repositories
# ============================================================================

async def create_grievance(db, grievance_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new grievance ticket with initial OPEN status."""
    now = datetime.now(timezone.utc)
    ticket_id = grievance_data.get("ticket_id") or f"GRV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    doc = dict(grievance_data)
    doc["ticket_id"] = ticket_id
    doc["status"] = doc.get("status", "OPEN")
    doc["priority"] = doc.get("priority", "MEDIUM")
    doc["timeline"] = [
        {
            "update_id": f"upd_{uuid.uuid4().hex[:8]}",
            "previous_status": None,
            "new_status": "OPEN",
            "comment": "Grievance registered in system via SAHAYAK AI Assistant",
            "updated_by": "SYSTEM",
            "timestamp": now,
        }
    ]
    doc["created_at"] = now
    doc["updated_at"] = now

    await db[COLLECTION_GRIEVANCES].insert_one(doc)
    return _serialize_doc(doc)  # type: ignore


async def get_grievance_by_ticket_id(db, ticket_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single grievance by its human-readable ticket_id."""
    doc = await db[COLLECTION_GRIEVANCES].find_one({"ticket_id": ticket_id})
    return _serialize_doc(doc)


async def get_user_grievances(db, user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all grievances raised by a particular citizen."""
    cursor = db[COLLECTION_GRIEVANCES].find({"user_id": user_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=50)
    return _serialize_list(docs)


async def get_all_grievances(
    db,
    status: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """List grievances for Officer Dashboard with optional filters."""
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if department:
        query["department"] = department
    if priority:
        query["priority"] = priority

    cursor = db[COLLECTION_GRIEVANCES].find(query).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return _serialize_list(docs)


async def update_grievance_status(
    db, ticket_id: str, new_status: str, comment: str, updated_by: str
) -> Optional[Dict[str, Any]]:
    """Officer workflow: update grievance status and append to timeline history."""
    now = datetime.now(timezone.utc)
    existing = await db[COLLECTION_GRIEVANCES].find_one({"ticket_id": ticket_id})
    if not existing:
        return None

    previous_status = existing.get("status")
    timeline_entry = {
        "update_id": f"upd_{uuid.uuid4().hex[:8]}",
        "previous_status": previous_status,
        "new_status": new_status,
        "comment": comment,
        "updated_by": updated_by,
        "timestamp": now,
    }

    await db[COLLECTION_GRIEVANCES].update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {"status": new_status, "updated_at": now},
            "$push": {"timeline": timeline_entry},
        },
    )
    return await get_grievance_by_ticket_id(db, ticket_id)


async def get_officer_dashboard_stats(db) -> Dict[str, Any]:
    """
    Compute aggregate metrics for the Officer Dashboard:
    - Total grievances
    - Breakdown by status (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED)
    - Category/Department counts
    """
    total = await db[COLLECTION_GRIEVANCES].count_documents({})
    open_count = await db[COLLECTION_GRIEVANCES].count_documents({"status": "OPEN"})
    in_progress = await db[COLLECTION_GRIEVANCES].count_documents({"status": {"$in": ["ASSIGNED", "IN_PROGRESS"]}})
    resolved = await db[COLLECTION_GRIEVANCES].count_documents({"status": "RESOLVED"})
    rejected = await db[COLLECTION_GRIEVANCES].count_documents({"status": "REJECTED"})
    schemes_count = await db[COLLECTION_SCHEMES].count_documents({"is_active": True})

    # Department breakdown aggregation
    pipeline = [
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    dept_cursor = db[COLLECTION_GRIEVANCES].aggregate(pipeline)
    dept_stats = await dept_cursor.to_list(length=20)

    return {
        "total_grievances": total,
        "open_grievances": open_count,
        "pending_grievances": in_progress,
        "resolved_grievances": resolved,
        "rejected_grievances": rejected,
        "active_schemes_count": schemes_count,
        "department_breakdown": [{"department": d["_id"] or "Unassigned", "count": d["count"]} for d in dept_stats],
    }


# ============================================================================
# Audit Logs (Append-Only)
# ============================================================================

async def log_audit_event(
    db,
    action: str,
    actor_id: Optional[str] = None,
    role: Optional[str] = None,
    resource_type: str = "general",
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Append an immutable audit log entry."""
    doc = {
        "log_id": f"aud_{uuid.uuid4().hex[:12]}",
        "action": action,
        "actor_id": actor_id,
        "role": role,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc),
    }
    await db[COLLECTION_AUDIT_LOGS].insert_one(doc)
    return _serialize_doc(doc)  # type: ignore
