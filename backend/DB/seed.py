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
    COLLECTION_SCHEMES,
    COLLECTION_SCHEME_RULES,
    COLLECTION_ELIGIBILITY_CHECKS,
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

    # Schemes Indexes
    try:
        db[COLLECTION_SCHEMES].create_index("scheme_id", unique=True)
        db[COLLECTION_SCHEMES].create_index("scheme_code", unique=True)
        db[COLLECTION_SCHEMES].create_index("category")
        db[COLLECTION_SCHEMES].create_index("is_active")
        logger.info("  ✓ Schemes indexes created.")
    except Exception as e:
        logger.warning(f"  ! Schemes index creation note: {e}")

    # Scheme Rules Indexes
    try:
        db[COLLECTION_SCHEME_RULES].create_index("scheme_id", unique=True)
        logger.info("  ✓ Scheme Rules indexes created.")
    except Exception as e:
        logger.warning(f"  ! Scheme Rules index creation note: {e}")

    # Eligibility Checks Indexes
    try:
        db[COLLECTION_ELIGIBILITY_CHECKS].create_index("user_id")
        db[COLLECTION_ELIGIBILITY_CHECKS].create_index("scheme_id")
        db[COLLECTION_ELIGIBILITY_CHECKS].create_index("timestamp")
        logger.info("  ✓ Eligibility Checks indexes created.")
    except Exception as e:
        logger.warning(f"  ! Eligibility Checks index creation note: {e}")

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


def seed_schemes(db):
    """Seed schemes into the schemes collection."""
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
    ]

    for u in demo_users:
        collection.update_one(
            {"email": u["email"]},
            {"$set": u},
            upsert=True
        )
    logger.info("  ✓ Successfully seeded demo citizen and officer accounts.")


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
