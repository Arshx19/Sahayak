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


def _to_str(val: Any) -> Any:
    """Helper to convert enum or object to clean string for MongoDB storage."""
    if val is None:
        return None
    if hasattr(val, "value"):
        return val.value
    return str(val)


def _serialize_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Serialize a list of MongoDB documents."""
    return [_serialize_doc(d) for d in docs if d]


# ============================================================================
# Users Repositories (Used by Auth & User Management)
# ============================================================================

async def create_user(db, user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user account with unique email enforcement."""
    now = datetime.now(timezone.utc)
    email = user_data.get("email", "").strip().lower() if user_data.get("email") else ""

    if email:
        existing = await get_user_by_email(db, email)
        if existing:
            raise ValueError(f"User with email '{email}' already exists")

    user_id = user_data.get("user_id") or f"usr_{uuid.uuid4().hex[:12]}"
    doc = dict(user_data)
    doc["user_id"] = user_id
    if email:
        doc["email"] = email
    doc["role"] = _to_str(doc.get("role", "citizen"))
    doc["is_active"] = doc.get("is_active", True)
    doc["created_at"] = now
    doc["updated_at"] = now

    await db[COLLECTION_USERS].insert_one(doc)
    return _serialize_doc(doc)  # type: ignore


async def get_user_by_email(db, email: str) -> Optional[Dict[str, Any]]:
    """Retrieve user by email address (case-insensitive)."""
    clean_email = email.strip().lower()
    doc = await db[COLLECTION_USERS].find_one({"email": clean_email})
    return _serialize_doc(doc)


async def get_user_by_id(db, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user by user_id or _id."""
    doc = await db[COLLECTION_USERS].find_one(
        {"$or": [{"user_id": user_id}, {"_id": user_id}]}
    )
    return _serialize_doc(doc)


async def update_user(
    db, user_id: str, update_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Update user account attributes."""
    now = datetime.now(timezone.utc)
    clean_update = {
        k: v for k, v in update_data.items()
        if k not in ("user_id", "created_at", "_id")
    }
    if "email" in clean_update and clean_update["email"]:
        clean_update["email"] = clean_update["email"].strip().lower()
    if "role" in clean_update and clean_update["role"]:
        clean_update["role"] = _to_str(clean_update["role"])
    clean_update["updated_at"] = now

    await db[COLLECTION_USERS].update_one(
        {"$or": [{"user_id": user_id}, {"_id": user_id}]},
        {"$set": clean_update},
    )
    return await get_user_by_id(db, user_id)


async def delete_user(db, user_id: str, soft_delete: bool = True) -> bool:
    """Deactivate (soft delete) or remove user account."""
    if soft_delete:
        now = datetime.now(timezone.utc)
        res = await db[COLLECTION_USERS].update_one(
            {"$or": [{"user_id": user_id}, {"_id": user_id}]},
            {"$set": {"is_active": False, "updated_at": now}},
        )
        return res.modified_count > 0
    else:
        res = await db[COLLECTION_USERS].delete_one(
            {"$or": [{"user_id": user_id}, {"_id": user_id}]}
        )
        return res.deleted_count > 0


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
    """Get a single scheme by scheme_id or scheme_code with case/format tolerance."""
    normalized_id = scheme_id.strip()
    alt_id = normalized_id.lower().replace("-", "_")
    alt_code = normalized_id.upper().replace("_", "-")

    doc = await db[COLLECTION_SCHEMES].find_one(
        {
            "$or": [
                {"scheme_id": normalized_id},
                {"scheme_code": normalized_id},
                {"scheme_id": alt_id},
                {"scheme_code": alt_code},
            ]
        }
    )
    return _serialize_doc(doc)


async def get_scheme_rules(db, scheme_id: str) -> Optional[Dict[str, Any]]:
    """Fetch deterministic eligibility rules for a specific scheme."""
    normalized_id = scheme_id.strip().lower().replace("-", "_")
    doc = await db[COLLECTION_SCHEME_RULES].find_one(
        {"$or": [{"scheme_id": scheme_id}, {"scheme_id": normalized_id}]}
    )
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

    # Avoid MongoDB path conflict between $set and $setOnInsert for created_at
    update_doc = {k: v for k, v in scheme_data.items() if k not in ("created_at", "_id")}
    update_doc["updated_at"] = now

    await db[COLLECTION_SCHEMES].update_one(
        {"scheme_id": scheme_id},
        {"$set": update_doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return await get_scheme_by_id(db, scheme_id)  # type: ignore


async def delete_scheme(db, scheme_id: str, soft_delete: bool = True) -> bool:
    """Deactivate (soft delete) or remove a government scheme."""
    normalized_id = scheme_id.strip()
    alt_id = normalized_id.lower().replace("-", "_")
    alt_code = normalized_id.upper().replace("_", "-")
    filter_query = {
        "$or": [
            {"scheme_id": normalized_id},
            {"scheme_code": normalized_id},
            {"scheme_id": alt_id},
            {"scheme_code": alt_code},
        ]
    }
    if soft_delete:
        now = datetime.now(timezone.utc)
        res = await db[COLLECTION_SCHEMES].update_one(
            filter_query,
            {"$set": {"is_active": False, "updated_at": now}},
        )
        return res.modified_count > 0
    else:
        res = await db[COLLECTION_SCHEMES].delete_one(filter_query)
        return res.deleted_count > 0


async def create_or_update_scheme_rules(
    db, scheme_id: str, rules_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Create or replace full eligibility rule set for a scheme."""
    now = datetime.now(timezone.utc)
    normalized_id = scheme_id.strip().lower().replace("-", "_")
    doc = dict(rules_data)
    doc["scheme_id"] = normalized_id
    doc["updated_at"] = now

    update_doc = {k: v for k, v in doc.items() if k not in ("created_at", "_id")}

    await db[COLLECTION_SCHEME_RULES].update_one(
        {"scheme_id": normalized_id},
        {"$set": update_doc, "$setOnInsert": {"created_at": now, "version": "1.0", "logic": "AND"}},
        upsert=True,
    )
    return await get_scheme_rules(db, normalized_id)  # type: ignore


async def add_scheme_rule_condition(
    db, scheme_id: str, rule_condition: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Append a single rule condition to a scheme's rules list."""
    now = datetime.now(timezone.utc)
    normalized_id = scheme_id.strip().lower().replace("-", "_")

    await db[COLLECTION_SCHEME_RULES].update_one(
        {"scheme_id": normalized_id},
        {
            "$push": {"rules": rule_condition},
            "$set": {"updated_at": now},
            "$setOnInsert": {"version": "1.0", "logic": "AND", "created_at": now},
        },
        upsert=True,
    )
    return await get_scheme_rules(db, normalized_id)


async def delete_scheme_rules(db, scheme_id: str) -> bool:
    """Delete all rules associated with a scheme."""
    normalized_id = scheme_id.strip().lower().replace("-", "_")
    res = await db[COLLECTION_SCHEME_RULES].delete_one({"scheme_id": normalized_id})
    return res.deleted_count > 0


# ============================================================================
# Citizen Profiles Repositories (Used by AI Extraction & User Profile)
# ============================================================================

async def get_citizen_profile(db, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve citizen profile for a given user_id."""
    doc = await db[COLLECTION_CITIZEN_PROFILES].find_one({"user_id": user_id})
    return _serialize_doc(doc)


async def upsert_citizen_profile(
    db, user_id: str, profile_data: Dict[str, Any], preserve_existing: bool = True
) -> Dict[str, Any]:
    """
    Save or incrementally update citizen profile (extracted by AI or submitted by user).
    If preserve_existing is True, fields with None values in profile_data will not
    overwrite previously extracted information (crucial for dynamic voice interviews).
    """
    now = datetime.now(timezone.utc)

    if preserve_existing:
        # Ignore None fields so partial voice extractions don't overwrite known fields
        update_doc = {
            k: v for k, v in profile_data.items()
            if v is not None and k not in ("user_id", "created_at", "profile_id", "_id")
        }
    else:
        update_doc = {
            k: v for k, v in profile_data.items()
            if k not in ("user_id", "created_at", "profile_id", "_id")
        }

    update_doc["user_id"] = user_id
    update_doc["updated_at"] = now

    await db[COLLECTION_CITIZEN_PROFILES].update_one(
        {"user_id": user_id},
        {
            "$set": update_doc,
            "$setOnInsert": {
                "profile_id": f"prof_{uuid.uuid4().hex[:10]}",
                "created_at": now,
            },
        },
        upsert=True,
    )
    updated = await db[COLLECTION_CITIZEN_PROFILES].find_one({"user_id": user_id})
    return _serialize_doc(updated)  # type: ignore


async def delete_citizen_profile(db, user_id: str) -> bool:
    """Delete a citizen demographic profile for the given user_id."""
    res = await db[COLLECTION_CITIZEN_PROFILES].delete_one({"user_id": user_id})
    return res.deleted_count > 0


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
    doc["status"] = _to_str(doc.get("status", "OPEN"))
    doc["priority"] = _to_str(doc.get("priority", "MEDIUM"))
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
        query["status"] = _to_str(status)
    if department:
        query["department"] = department
    if priority:
        query["priority"] = _to_str(priority)

    cursor = db[COLLECTION_GRIEVANCES].find(query).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return _serialize_list(docs)


async def update_grievance_status(
    db, ticket_id: str, new_status: Any, comment: str, updated_by: str
) -> Optional[Dict[str, Any]]:
    """Officer workflow: update grievance status and append to timeline history."""
    now = datetime.now(timezone.utc)
    existing = await db[COLLECTION_GRIEVANCES].find_one({"ticket_id": ticket_id})
    if not existing:
        return None

    str_new_status = _to_str(new_status)
    previous_status = existing.get("status")
    timeline_entry = {
        "update_id": f"upd_{uuid.uuid4().hex[:8]}",
        "previous_status": previous_status,
        "new_status": str_new_status,
        "comment": comment,
        "updated_by": updated_by,
        "timestamp": now,
    }

    await db[COLLECTION_GRIEVANCES].update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {"status": str_new_status, "updated_at": now},
            "$push": {"timeline": timeline_entry},
        },
    )
    return await get_grievance_by_ticket_id(db, ticket_id)


async def assign_grievance_officer(
    db, ticket_id: str, officer_id: str, comment: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Assign grievance ticket to an officer, update status to ASSIGNED, and append to timeline."""
    now = datetime.now(timezone.utc)
    existing = await db[COLLECTION_GRIEVANCES].find_one({"ticket_id": ticket_id})
    if not existing:
        return None

    timeline_entry = {
        "update_id": f"upd_{uuid.uuid4().hex[:8]}",
        "previous_status": existing.get("status"),
        "new_status": "ASSIGNED",
        "comment": comment or f"Assigned to officer {officer_id}",
        "updated_by": officer_id,
        "timestamp": now,
    }

    await db[COLLECTION_GRIEVANCES].update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "assigned_officer": officer_id,
                "status": "ASSIGNED",
                "updated_at": now,
            },
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
