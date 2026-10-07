"""
SAHAYAK Database Seeding & Index Setup Script
Initializes MongoDB collections with:
- 10 real government schemes
- Deterministic eligibility rules
- Initial test accounts (Citizen, Officer, Admin)
- Performance & uniqueness indexes
"""

import json
import logging
import os
import sys
from typing import Optional
from pathlib import Path
from datetime import datetime, timezone

# Add parent directory to path to enable relative DB imports if run as script
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from DB.config import (
    COLLECTION_USERS,
    COLLECTION_CITIZEN_PROFILES,
    COLLECTION_USER_DOCUMENTS,
    COLLECTION_SCHEMES,
    COLLECTION_SCHEME_RULES,
    COLLECTION_ELIGIBILITY_CHECKS,
    COLLECTION_NOTIFICATIONS,
    COLLECTION_GRIEVANCES,
    COLLECTION_AUDIT_LOGS,
    MONGO_DB_NAME,
    MONGODB_URI,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("sahayak.db.seed")


def load_json_file(filename: str) -> list:
    """Load JSON file from seeds directory."""
    file_path = current_dir / "seeds" / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Seed file not found: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def setup_indexes(db):
    """Create essential MongoDB indexes for performance and data integrity."""
    logger.info("Setting up collection indexes...")

    # Users Indexes
    try:
        db[COLLECTION_USERS].create_index("user_id", unique=True, sparse=True)
        db[COLLECTION_USERS].create_index("email", unique=True, sparse=True)
        db[COLLECTION_USERS].create_index("phone", sparse=True)
        db[COLLECTION_USERS].create_index("role")
        logger.info("  ✓ Users indexes created.")
    except Exception as e:
        logger.warning(f"  ! Users index creation note: {e}")

    # Citizen Profiles Indexes
    try:
        db[COLLECTION_CITIZEN_PROFILES].create_index("user_id", sparse=True)
        db[COLLECTION_CITIZEN_PROFILES].create_index("state")
        db[COLLECTION_CITIZEN_PROFILES].create_index("occupation")
        logger.info("  ✓ Citizen Profiles indexes created.")
    except Exception as e:
        logger.warning(f"  ! Citizen Profiles index creation note: {e}")

    # User Documents Indexes (Document-centric dashboard queries)
    try:
        db[COLLECTION_USER_DOCUMENTS].create_index([("user_id", 1), ("document_type", 1)], unique=True)
        db[COLLECTION_USER_DOCUMENTS].create_index("user_id")
        db[COLLECTION_USER_DOCUMENTS].create_index("verification_status")
        db[COLLECTION_USER_DOCUMENTS].create_index("uploaded_at")
        logger.info("  ✓ User Documents indexes created.")
    except Exception as e:
        logger.warning(f"  ! User Documents index creation note: {e}")

    # Schemes Indexes (Filtering by state, category, type, provider, active status)
    try:
        db[COLLECTION_SCHEMES].create_index("scheme_id", unique=True)
        db[COLLECTION_SCHEMES].create_index("scheme_code", unique=True)
        db[COLLECTION_SCHEMES].create_index([("is_active", 1), ("category", 1)])
        db[COLLECTION_SCHEMES].create_index([("is_active", 1), ("provider", 1)])
        db[COLLECTION_SCHEMES].create_index("applicable_states")
        logger.info("  ✓ Schemes indexes created.")
    except Exception as e:
        logger.warning(f"  ! Schemes index creation note: {e}")

    # Scheme Rules Indexes
    try:
        db[COLLECTION_SCHEME_RULES].create_index("scheme_id", unique=True)
        logger.info("  ✓ Scheme Rules indexes created.")
    except Exception as e:
        logger.warning(f"  ! Scheme Rules index creation note: {e}")

    # Eligibility Checks Indexes (User queries, explainable failures)
    try:
        db[COLLECTION_ELIGIBILITY_CHECKS].create_index([("user_id", 1), ("scheme_id", 1)])
        db[COLLECTION_ELIGIBILITY_CHECKS].create_index([("user_id", 1), ("is_eligible", 1)])
        db[COLLECTION_ELIGIBILITY_CHECKS].create_index("timestamp")
        logger.info("  ✓ Eligibility Checks indexes created.")
    except Exception as e:
        logger.warning(f"  ! Eligibility Checks index creation note: {e}")

    # Notifications Indexes (User notifications, unread queries)
    try:
        db[COLLECTION_NOTIFICATIONS].create_index([("user_id", 1), ("is_read", 1)])
        db[COLLECTION_NOTIFICATIONS].create_index("created_at")
        logger.info("  ✓ Notifications indexes created.")
    except Exception as e:
        logger.warning(f"  ! Notifications index creation note: {e}")

    # Grievances Indexes
    try:
        db[COLLECTION_GRIEVANCES].create_index("ticket_id", unique=True)
        db[COLLECTION_GRIEVANCES].create_index("user_id")
        db[COLLECTION_GRIEVANCES].create_index("status")
        db[COLLECTION_GRIEVANCES].create_index("department")
        db[COLLECTION_GRIEVANCES].create_index("priority")
        db[COLLECTION_GRIEVANCES].create_index("created_at")
        logger.info("  ✓ Grievances indexes created.")
    except Exception as e:
        logger.warning(f"  ! Grievances index creation note: {e}")

    # Audit Logs Indexes
    try:
        db[COLLECTION_AUDIT_LOGS].create_index("actor_id")
        db[COLLECTION_AUDIT_LOGS].create_index("action")
        db[COLLECTION_AUDIT_LOGS].create_index("timestamp")
        logger.info("  ✓ Audit Logs indexes created.")
    except Exception as e:
        logger.warning(f"  ! Audit Logs index creation note: {e}")


def import_schemes_from_excel(excel_path: Optional[Path] = None) -> list:
    """Import and normalize scheme data directly from Government_Schemes_India_2026_SIMPLIFIED.xlsx."""
    if excel_path is None:
        # Check standard locations in project
        candidate_paths = [
            current_dir.parent.parent / "Government_Schemes_India_2026_SIMPLIFIED.xlsx",
            current_dir.parent / "Government_Schemes_India_2026_SIMPLIFIED.xlsx",
            current_dir / "Government_Schemes_India_2026_SIMPLIFIED.xlsx",
            current_dir / "seeds" / "Government_Schemes_India_2026_SIMPLIFIED.xlsx",
        ]
        for p in candidate_paths:
            if p.exists():
                excel_path = p
                break

    if not excel_path or not excel_path.exists():
        return []

    try:
        import openpyxl
        wb = openpyxl.load_workbook(excel_path, data_only=True)
        if "SCHEMES" not in wb.sheetnames or "DOCUMENT_TYPES" not in wb.sheetnames:
            return []

        doc_map = {}
        ws_docs = wb["DOCUMENT_TYPES"]
        for row in ws_docs.iter_rows(min_row=2, values_only=True):
            if row and len(row) >= 3 and row[1] and row[2]:
                doc_map[str(row[1]).strip()] = str(row[2]).strip()

        ws_schemes = wb["SCHEMES"]
        headers = [c.value for c in ws_schemes[1]]
        schemes = []
        for row in ws_schemes.iter_rows(min_row=2, values_only=True):
            if not row or not any(row):
                continue
            d = dict(zip(headers, row))
            if not d.get("scheme_id"):
                continue

            doc_list = []
            if d.get("required_documents"):
                for doc_name in str(d["required_documents"]).split(" | "):
                    clean_name = doc_name.strip()
                    code = doc_map.get(clean_name, clean_name.lower().replace(" ", "_"))
                    doc_list.append(code)

            st = str(d.get("state", "")).strip()
            applicable_states = ["ALL"] if st.lower() in ("all india", "all", "central", "") else [st]

            timeline = {
                "application_start": d.get("application_start"),
                "application_end": d.get("application_end"),
                "application_frequency": d.get("application_frequency"),
                "application_status": d.get("application_status"),
            }

            scheme_obj = {
                "scheme_id": str(d["scheme_id"]).strip(),
                "scheme_code": str(d["scheme_id"]).strip(),
                "name": str(d.get("scheme_name", "")).strip(),
                "category": str(d.get("scheme_category", "General")).strip(),
                "scheme_type": str(d.get("provider", "Central")).strip(),
                "provider": str(d.get("provider", "Central")).strip(),
                "state": st,
                "applicable_states": applicable_states,
                "description": str(d.get("description", "")).strip(),
                "benefits": str(d.get("description", "")).strip(),
                "eligibility": str(d.get("eligibility", "")).strip() if d.get("eligibility") else None,
                "required_documents": doc_list,
                "raw_required_documents": str(d.get("required_documents", "")).strip(),
                "timeline": timeline,
                "application_start": d.get("application_start"),
                "application_end": d.get("application_end"),
                "application_frequency": d.get("application_frequency"),
                "application_status": d.get("application_status"),
                "application_process": d.get("application_process"),
                "application_url": d.get("application_url"),
                "official_url": d.get("official_source"),
                "official_source": d.get("official_source"),
                "is_active": True,
                "status": "active",
                "version": "1.0",
            }
            schemes.append(scheme_obj)
        return schemes
    except Exception as e:
        logger.warning(f"Note: Excel direct parsing failed or openpyxl missing: {e}")
        return []


def seed_schemes(db):
    """Seed schemes into the schemes collection from Excel or JSON."""
    schemes = import_schemes_from_excel()
    if not schemes:
        schemes = load_json_file("schemes_data.json")
    collection = db[COLLECTION_SCHEMES]
    now = datetime.now(timezone.utc)

    count = 0
    for s in schemes:
        doc = dict(s)
        doc["updated_at"] = now
        collection.update_one(
            {"scheme_id": s["scheme_id"]},
            {
                "$set": doc,
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )
        count += 1
    logger.info(f"  ✓ Successfully seeded {count} schemes.")


def seed_rules(db):
    """Seed eligibility rules into the scheme_rules collection."""
    rules = load_json_file("rules_data.json")
    collection = db[COLLECTION_SCHEME_RULES]
    now = datetime.now(timezone.utc)

    count = 0
    for r in rules:
        doc = dict(r)
        doc["updated_at"] = now
        collection.update_one(
            {"scheme_id": r["scheme_id"]},
            {
                "$set": doc,
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )
        count += 1
    logger.info(f"  ✓ Successfully seeded {count} scheme rule definitions.")


def seed_demo_users(db):
    """Seed initial demo users for Citizen and Officer roles."""
    collection = db[COLLECTION_USERS]
    now = datetime.now(timezone.utc)

    # Simple demo accounts (in production hashed with bcrypt)
    demo_users = [
        {
            "user_id": "usr_demo_citizen",
            "name": "Ramesh Kumar",
            "email": "citizen@sahayak.gov.in",
            "phone": "9876543210",
            "role": "citizen",
            "password_hash": "$2b$12$e80yqV8vWvh9gQxK.XlIke18t3N7jN3e8X7fV9x2Qy6.Jb0pW8f9S",  # demo placeholder
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "user_id": "usr_demo_officer",
            "name": "Priya Sharma (District Welfare Officer)",
            "email": "officer@sahayak.gov.in",
            "phone": "9876543211",
            "role": "officer",
            "password_hash": "$2b$12$e80yqV8vWvh9gQxK.XlIke18t3N7jN3e8X7fV9x2Qy6.Jb0pW8f9S",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "user_id": "usr_demo_admin",
            "name": "System Administrator",
            "email": "admin@sahayak.gov.in",
            "phone": "9876543212",
            "role": "admin",
            "password_hash": "$2b$12$e80yqV8vWvh9gQxK.XlIke18t3N7jN3e8X7fV9x2Qy6.Jb0pW8f9S",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    for u in demo_users:
        collection.update_one(
            {"email": u["email"]},
            {"$set": u},
            upsert=True
        )
    logger.info("  ✓ Successfully seeded demo citizen, officer, and admin accounts.")


def run_seeder():
    """Main seeder runner."""
    logger.info(f"Connecting to MongoDB at: {MONGODB_URI}")
    logger.info(f"Target Database: {MONGO_DB_NAME}")

    try:
        from pymongo import MongoClient
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command("ping")
        db = client[MONGO_DB_NAME]
        logger.info("Connected to MongoDB successfully.")

        setup_indexes(db)
        seed_schemes(db)
        seed_rules(db)
        seed_demo_users(db)

        logger.info("=" * 50)
        logger.info("🎉 Database seeding and index creation completed successfully!")
        logger.info("=" * 50)
        client.close()
    except Exception as exc:
        logger.error(f"Seeding failed or MongoDB is not running: {exc}")
        logger.info("Hint: Make sure MONGODB_URI is set or local MongoDB is active.")
        sys.exit(1)


if __name__ == "__main__":
    run_seeder()
