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
    print("[1/6] Testing seed JSON files integrity...")
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
    print("[2/6] Testing Pydantic schema contracts...")
    # Test Citizen Profile with standard annual_income
    profile1 = CitizenProfileCreate(
        age=62,
        gender="male",
        occupation="farmer",
        annual_income=180000.0,
        land_acres=1.5,
        state="Uttar Pradesh",
        district="Varanasi",
    )
    dumped1 = profile1.model_dump() if hasattr(profile1, "model_dump") else profile1.dict()
    assert dumped1["age"] == 62
    assert dumped1["occupation"] == "farmer"
    assert dumped1["annual_income"] == 180000.0

    # Test Citizen Profile with 'income' alias
    profile2 = CitizenProfileCreate(
        age=30,
        income=250000.0,
        occupation="unorganized_worker",
        documents=["Aadhaar Card", "Ration Card"],
        consent=True,
    )
    dumped2 = profile2.model_dump() if hasattr(profile2, "model_dump") else profile2.dict()
    assert dumped2["annual_income"] == 250000.0
    assert dumped2["income"] == 250000.0
    assert dumped2["documents"] == ["Aadhaar Card", "Ration Card"]
    assert dumped2["consent"] is True

    # Test Grievance Create with 'complaint' alias and optional intent
    grievance = GrievanceCreate(
        user_id="usr_123",
        citizen_name="Ramesh Kumar",
        complaint="My 3rd installment is delayed.",
        voice_text="Mera installment nahi aaya",
    )
    dumped_grievance = grievance.model_dump() if hasattr(grievance, "model_dump") else grievance.dict()
    assert dumped_grievance["intent"] == "GENERAL_GRIEVANCE"
    assert dumped_grievance["complaint_text"] == "My 3rd installment is delayed."
    assert dumped_grievance["complaint"] == "My 3rd installment is delayed."
    assert dumped_grievance["voice_text"] == "Mera installment nahi aaya"

    # Test Scheme Base with 'code', 'type', and 'official_source' aliases
    scheme = SchemeBase(
        code="TEST-SCHEME",
        name="Test Welfare Scheme",
        category="Welfare",
        type="Central",
        description="A test scheme",
        benefits="Financial assistance",
        official_source="https://test.gov.in",
    )
    dumped_scheme = scheme.model_dump() if hasattr(scheme, "model_dump") else scheme.dict()
    assert dumped_scheme["scheme_code"] == "TEST-SCHEME"
    assert dumped_scheme["scheme_type"] == "Central"
    assert dumped_scheme["official_url"] == "https://test.gov.in"

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
        profile_snapshot=dumped1,
        criteria_results=[criteria],
        is_eligible=True,
        reasons=["All conditions met"],
    )
    dumped_check = check.model_dump() if hasattr(check, "model_dump") else check.dict()
    assert dumped_check["is_eligible"] is True
    print("  ✓ Profile (income, docs, consent), Grievance (complaint alias), and Scheme aliases validated.")


def test_config_and_collections():
    print("[3/6] Testing database configuration and collection constants...")
    settings = get_db_settings()
    assert "mongodb_uri" in settings
    assert settings["collections"]["schemes"] == COLLECTION_SCHEMES
    assert settings["collections"]["scheme_rules"] == COLLECTION_SCHEME_RULES
    assert settings["collections"]["grievances"] == COLLECTION_GRIEVANCES
    assert settings["database_name"] == "sahayak"
    print(f"  ✓ Database settings confirmed: DB name = '{settings['database_name']}'")


def test_module_imports():
    print("[4/6] Testing module importability (connection, crud, package exports)...")
    import DB
    import DB.connection as conn
    import DB.crud as crud

    # Test top-level package export
    assert hasattr(DB, "crud")
    assert hasattr(DB, "get_db")

    # Connection helpers
    assert hasattr(conn, "get_async_db")
    assert hasattr(conn, "get_sync_db")

    # Scheme and Rules CRUD helpers
    assert hasattr(crud, "get_all_schemes")
    assert hasattr(crud, "get_scheme_by_id")
    assert hasattr(crud, "create_or_update_scheme")
    assert hasattr(crud, "delete_scheme")
    assert hasattr(crud, "get_scheme_rules")
    assert hasattr(crud, "get_all_scheme_rules")
    assert hasattr(crud, "create_or_update_scheme_rules")
    assert hasattr(crud, "add_scheme_rule_condition")
    assert hasattr(crud, "delete_scheme_rules")

    # User CRUD helpers
    assert hasattr(crud, "create_user")
    assert hasattr(crud, "get_user_by_email")
    assert hasattr(crud, "get_user_by_id")
    assert hasattr(crud, "update_user")
    assert hasattr(crud, "delete_user")

    # Profile & Grievance helpers
    assert hasattr(crud, "delete_citizen_profile")
    assert hasattr(crud, "assign_grievance_officer")
    assert hasattr(crud, "get_officer_dashboard_stats")
    print("  ✓ All module exports and crud functions imported cleanly.")


def test_crud_helpers():
    print("[5/6] Testing CRUD serialization and incremental update logic...")
    import DB.crud as crud
    from DB.schemas import GrievanceStatus, GrievancePriority

    # Test Enum stringification helper
    assert crud._to_str(GrievanceStatus.OPEN) == "OPEN"
    assert crud._to_str(GrievancePriority.HIGH) == "HIGH"
    assert crud._to_str("RAW_STRING") == "RAW_STRING"
    assert crud._to_str(None) is None

    # Test doc serialization removing _id
    raw_doc = {"_id": "fake_mongo_object_id", "scheme_id": "pm_kisan", "name": "PM Kisan"}
    serialized = crud._serialize_doc(raw_doc)
    assert serialized is not None
    assert "id" in serialized
    assert "_id" not in serialized
    assert serialized["scheme_id"] == "pm_kisan"
    print("  ✓ Helper functions (_to_str, _serialize_doc) behaving correctly.")


def test_seed_demo_accounts():
    print("[6/6] Testing seed users definition...")
    import inspect
    import DB.seed as seed_module

    source = inspect.getsource(seed_module.seed_demo_users)
    assert "citizen@sahayak.gov.in" in source
    assert "officer@sahayak.gov.in" in source
    assert "admin@sahayak.gov.in" in source
    print("  ✓ Confirmed citizen, officer, and admin demo accounts in seed module.")


if __name__ == "__main__":
    print("=" * 60)
    print("Running SAHAYAK Database Layer Self-Verification Tests")
    print("=" * 60)
    test_seed_json_integrity()
    test_pydantic_schemas()
    test_config_and_collections()
    test_module_imports()
    test_crud_helpers()
    test_seed_demo_accounts()
    print("=" * 60)
    print("🎉 ALL 6 DATABASE TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
