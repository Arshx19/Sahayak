import os
from pathlib import Path

# Attempt to load .env from project root or backend folder if python-dotenv is installed
try:
    from dotenv import load_dotenv
    # Search for .env in current dir, parent dir, or repo root
    current_dir = Path(__file__).resolve().parent
    env_paths = [
        current_dir / ".env",
        current_dir.parent / ".env",
        current_dir.parent.parent / ".env",
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path)
            break
except ImportError:
    pass

# MongoDB Connection Configuration
MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "sahayak")

# Standardized MongoDB Collection Names
COLLECTION_USERS = "users"
COLLECTION_CITIZEN_PROFILES = "citizen_profiles"
COLLECTION_SCHEMES = "schemes"
COLLECTION_SCHEME_RULES = "scheme_rules"
COLLECTION_ELIGIBILITY_CHECKS = "eligibility_checks"
COLLECTION_CONVERSATIONS = "conversations"
COLLECTION_GRIEVANCES = "grievances"
COLLECTION_GRIEVANCE_UPDATES = "grievance_updates"
COLLECTION_AUDIT_LOGS = "audit_logs"

def get_db_settings() -> dict:
    """Return dictionary of current database connection settings."""
    return {
        "mongodb_uri": MONGODB_URI,
        "database_name": MONGO_DB_NAME,
        "collections": {
            "users": COLLECTION_USERS,
            "citizen_profiles": COLLECTION_CITIZEN_PROFILES,
            "schemes": COLLECTION_SCHEMES,
            "scheme_rules": COLLECTION_SCHEME_RULES,
            "eligibility_checks": COLLECTION_ELIGIBILITY_CHECKS,
            "conversations": COLLECTION_CONVERSATIONS,
            "grievances": COLLECTION_GRIEVANCES,
            "grievance_updates": COLLECTION_GRIEVANCE_UPDATES,
            "audit_logs": COLLECTION_AUDIT_LOGS,
        }
    }
