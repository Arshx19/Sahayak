"""
Automated Verification Test for SAHAYAK DB Layer
Validates:
- JSON integrity and completeness for all 10 schemes and rules
- Pydantic models serialization and validation
- Repository CRUD and Router helper syntax
"""

import json
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from DB.config import (
    COLLECTION_USERS,
    COLLECTION_CITIZEN_PROFILES,
    COLLECTION_SCHEMES,
    COLLECTION_SCHEME_RULES,
    COLLECTION_ELIGIBILITY_CHECKS,
    COLLECTION_GRIEVANCES,
    COLLECTION_AUDIT_LOGS,
    get_db_settings,
)
from DB.schemas import (
    CitizenProfileCreate,
    SchemeBase,
    GrievanceCreate,
    EligibilityCheckRecord,
    CriteriaResult,
)


def test_seed_json_integrity():
    print("[1/4] Testing seed JSON files integrity...")
    seeds_dir = Path(__file__).resolve().parent / "seeds"

    with open(seeds_dir / "schemes_data.json", "r", encoding="utf-8") as f:
        schemes = json.load(f)
    assert len(schemes) == 10, f"Expected 10 schemes, got {len(schemes)}"

    with open(seeds_dir / "rules_data.json", "r", encoding="utf-8") as f:
        rules = json.load(f)
    assert len(rules) == 10, f"Expected 10 rules sets, got {len(rules)}"

    scheme_ids = {s["scheme_id"] for s in schemes}
    rule_scheme_ids = {r["scheme_id"] for r in rules}

    assert scheme_ids == rule_scheme_ids, f"Mismatch between schemes and rules: {scheme_ids ^ rule_scheme_ids}"
    print(f"  ✓ Validated 10 schemes and rules: {sorted(list(scheme_ids))}")


def test_pydantic_schemas():
    print("[2/4] Testing Pydantic schema contracts...")
    # Test Citizen Profile
    profile = CitizenProfileCreate(
        age=62,
        gender="male",
        occupation="farmer",
        annual_income=180000.0,
        land_acres=1.5,
        state="Uttar Pradesh",
        district="Varanasi",
    )
    dumped_profile = profile.model_dump() if hasattr(profile, "model_dump") else profile.dict()
    assert dumped_profile["age"] == 62
    assert dumped_profile["occupation"] == "farmer"

    # Test Grievance Create
    grievance = GrievanceCreate(
        user_id="usr_123",
        citizen_name="Ramesh Kumar",
        scheme_id="pm_kisan",
        intent="Payment Delay",
        complaint_text="My 3rd installment is delayed.",
    )
    dumped_grievance = grievance.model_dump() if hasattr(grievance, "model_dump") else grievance.dict()
    assert dumped_grievance["intent"] == "Payment Delay"

    # Test Eligibility Check Record
    criteria = CriteriaResult(
        field="occupation",
        passed=True,
        user_value="farmer",
        required_value="farmer",
        operator="==",
        explanation="Applicant is a farmer",
    )
    check = EligibilityCheckRecord(
        scheme_id="pm_kisan",
        scheme_name="Pradhan Mantri Kisan Samman Nidhi",
        profile_snapshot=dumped_profile,
        criteria_results=[criteria],
        is_eligible=True,
        reasons=["All conditions met"],
    )
    dumped_check = check.model_dump() if hasattr(check, "model_dump") else check.dict()
    assert dumped_check["is_eligible"] is True
    print("  ✓ Profile, Grievance, and Eligibility schemas validated successfully.")


def test_config_and_collections():
    print("[3/4] Testing database configuration and collection constants...")
    settings = get_db_settings()
    assert "mongodb_uri" in settings
    assert settings["collections"]["schemes"] == COLLECTION_SCHEMES
    assert settings["collections"]["scheme_rules"] == COLLECTION_SCHEME_RULES
    assert settings["collections"]["grievances"] == COLLECTION_GRIEVANCES
    print(f"  ✓ Database settings confirmed: DB name = '{settings['database_name']}'")


def test_module_imports():
    print("[4/4] Testing module importability (connection, crud, router)...")
    import DB.connection as conn
    import DB.crud as crud
    import DB.router as router

    assert hasattr(conn, "get_async_db")
    assert hasattr(conn, "get_sync_db")
    assert hasattr(crud, "get_all_schemes")
    assert hasattr(crud, "get_scheme_rules")
    assert hasattr(crud, "get_officer_dashboard_stats")
    assert hasattr(router, "db_router")
    print("  ✓ All module exports, crud functions, and db_router imported cleanly.")


if __name__ == "__main__":
    print("=" * 60)
    print("Running SAHAYAK Database Layer Self-Verification Tests")
    print("=" * 60)
    test_seed_json_integrity()
    test_pydantic_schemas()
    test_config_and_collections()
    test_module_imports()
    print("=" * 60)
    print("🎉 ALL 4 DATABASE TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
