"""
Automated Verification Test for SAHAYAK DB Layer (Updated Workflow)
Validates:
- JSON integrity and completeness for all 10 schemes and rules
- Pydantic models serialization and validation (Users, Documents, Schemes, Eligibility, Notifications)
- Database configuration constants including user_documents and notifications
- Module imports and async repository contracts
- CRUD serialization, enum conversion, and helper logic
- Document-centric verification states, scheme provider/timeline, explainable failure criteria
- Seed user accounts definition and index setup contracts
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

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
    get_db_settings,
)
from DB.schemas import (
    UserRole,
    UserCreate,
    UserInDB,
    UserResponse,
    DocumentVerificationStatus,
    UserDocumentCreate,
    UserDocumentInDB,
    UserDocumentResponse,
    CitizenProfileCreate,
    SchemeBase,
    SchemeInDB,
    CriteriaResult,
    EligibilityCheckRecord,
    NotificationType,
    NotificationCreate,
    NotificationInDB,
    GrievanceCreate,
)


def test_seed_json_integrity():
    print("[1/8] Testing seed JSON files integrity...")
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

    # Verify provider, timeline, and required_documents in every scheme
    for s in schemes:
        assert "provider" in s, f"Scheme {s['scheme_id']} missing 'provider'"
        assert s["provider"] in ("Centre", "State", "Centre + State"), f"Invalid provider in {s['scheme_id']}"
        assert "timeline" in s, f"Scheme {s['scheme_id']} missing 'timeline'"
        assert isinstance(s["required_documents"], list), f"required_documents not list in {s['scheme_id']}"
        assert len(s["required_documents"]) > 0, f"required_documents empty in {s['scheme_id']}"

    print(f"  ✓ Validated 10 schemes with provider, timeline, and document lists: {sorted(list(scheme_ids))}")


def test_user_and_document_schemas():
    print("[2/8] Testing User and Document Pydantic schema contracts...")
    # User model
    user_in = UserCreate(
        name="Sunita Devi",
        email="sunita@example.com",
        phone="9876543210",
        password="secretpassword",
        role=UserRole.CITIZEN,
        state="Bihar",
        district="Patna",
    )
    dumped_user = user_in.model_dump()
    assert dumped_user["name"] == "Sunita Devi"
    assert dumped_user["state"] == "Bihar"
    assert dumped_user["role"] == "citizen"

    # User Document model (document-centric workflow)
    doc_create = UserDocumentCreate(
        user_id="usr_demo_citizen",
        document_type="aadhaar",
        document_name="Aadhaar Card",
        document_number="XXXX-XXXX-1234",
        file_url="https://storage.sahayak.gov.in/docs/aadhaar_1234.pdf",
        file_name="aadhaar_front.pdf",
        mime_type="application/pdf",
        verification_status=DocumentVerificationStatus.VERIFIED,
        metadata={"issuing_authority": "UIDAI", "state": "Bihar"},
    )
    dumped_doc = doc_create.model_dump()
    assert dumped_doc["document_type"] == "aadhaar"
    assert dumped_doc["verification_status"] == "verified"
    assert dumped_doc["metadata"]["issuing_authority"] == "UIDAI"

    # InDB model validation
    doc_in_db = UserDocumentInDB(
        document_id="doc_12345",
        user_id="usr_demo_citizen",
        document_type="income_certificate",
        verification_status=DocumentVerificationStatus.PENDING,
        metadata={"annual_income_certified": 120000},
    )
    dumped_db_doc = doc_in_db.model_dump()
    assert dumped_db_doc["document_id"] == "doc_12345"
    assert dumped_db_doc["verification_status"] == "pending"
    print("  ✓ User and UserDocument models validated successfully.")


def test_scheme_and_rules_schemas():
    print("[3/8] Testing Scheme and Deterministic Rules schema contracts...")
    scheme = SchemeBase(
        code="PM-KISAN",
        name="Pradhan Mantri Kisan Samman Nidhi",
        category="Agriculture",
        type="Central",
        provider="Centre",
        timeline={"validity": "5 years", "window": "Year-round"},
        description="Farmer income support",
        benefits="₹6,000 per year",
        required_documents=["aadhaar", "land_record", "bank_account_passbook"],
        official_source="https://pmkisan.gov.in",
    )
    dumped_scheme = scheme.model_dump()
    assert dumped_scheme["scheme_code"] == "PM-KISAN"
    assert dumped_scheme["scheme_type"] == "Central"
    assert dumped_scheme["provider"] == "Centre"
    assert "land_record" in dumped_scheme["required_documents"]
    assert dumped_scheme["official_url"] == "https://pmkisan.gov.in"
    print("  ✓ SchemeBase with provider, timeline, aliases, and document requirements validated.")


def test_explainable_eligibility_models():
    print("[4/8] Testing Explainable Eligibility Results models...")
    # 1. Passed criterion
    pass_criterion = CriteriaResult(
        criterion="OCCUPATION",
        field="occupation",
        passed=True,
        status="passed",
        user_value="farmer",
        required_value="farmer",
        operator="==",
        explanation="Applicant is a farmer",
        reason="Primary occupation is farmer",
    )

    # 2. Failed state criterion
    failed_state = CriteriaResult(
        criterion="STATE",
        field="state",
        passed=False,
        status="failed",
        user_value="Uttar Pradesh",
        required_value="Rajasthan",
        operator="==",
        explanation="Scheme available only in Rajasthan",
        reason="This scheme is only available in Rajasthan",
    )

    # 3. Missing document criterion
    missing_doc = CriteriaResult(
        criterion="LAND_RECORD",
        field="documents",
        passed=False,
        status="missing",
        user_value=None,
        required_value="land_record",
        operator="has_document",
        explanation="Land ownership record required",
        reason="Land ownership record has not been uploaded or verified",
    )

    record = EligibilityCheckRecord(
        check_id="chk_test_01",
        user_id="usr_demo_citizen",
        scheme_id="pm_kisan",
        scheme_name="Pradhan Mantri Kisan Samman Nidhi",
        profile_snapshot={"occupation": "farmer", "state": "Uttar Pradesh"},
        documents_snapshot=["aadhaar"],
        criteria_results=[pass_criterion, failed_state, missing_doc],
        is_eligible=False,
        missing_documents=["land_record"],
        reasons=[failed_state.reason, missing_doc.reason],
        required_documents=["aadhaar", "land_record"],
    )
    dumped_rec = record.model_dump()
    assert dumped_rec["is_eligible"] is False
    assert len(dumped_rec["criteria_results"]) == 3
    assert dumped_rec["missing_documents"] == ["land_record"]
    assert len(dumped_rec["reasons"]) == 2
    assert "Rajasthan" in dumped_rec["reasons"][0]
    print("  ✓ Explainable failure reasons and machine-readable criteria outcomes validated.")


def test_notification_schemas():
    print("[5/8] Testing User Notification models...")
    notif = NotificationCreate(
        user_id="usr_demo_citizen",
        scheme_id="pm_kisan",
        notification_type=NotificationType.SCHEME_UPDATED,
        title="Scheme Update: PM-KISAN",
        message="A new installment schedule has been announced.",
        context={"installment": 17, "date": "2026-11-01"},
    )
    dumped_notif = notif.model_dump()
    assert dumped_notif["user_id"] == "usr_demo_citizen"
    assert dumped_notif["notification_type"] == "SCHEME_UPDATED"
    assert dumped_notif["is_read"] is False

    notif_in_db = NotificationInDB(
        notification_id="notif_9876",
        **dumped_notif,
    )
    dumped_db_notif = notif_in_db.model_dump()
    assert dumped_db_notif["notification_id"] == "notif_9876"
    assert dumped_db_notif["read_at"] is None
    print("  ✓ NotificationCreate and NotificationInDB validated successfully.")


def test_config_and_collections():
    print("[6/8] Testing database configuration and collection constants...")
    settings = get_db_settings()
    assert "mongodb_uri" in settings
    assert settings["collections"]["users"] == COLLECTION_USERS
    assert settings["collections"]["user_documents"] == COLLECTION_USER_DOCUMENTS
    assert settings["collections"]["schemes"] == COLLECTION_SCHEMES
    assert settings["collections"]["scheme_rules"] == COLLECTION_SCHEME_RULES
    assert settings["collections"]["eligibility_checks"] == COLLECTION_ELIGIBILITY_CHECKS
    assert settings["collections"]["notifications"] == COLLECTION_NOTIFICATIONS
    assert settings["collections"]["grievances"] == COLLECTION_GRIEVANCES
    assert settings["collections"]["audit_logs"] == COLLECTION_AUDIT_LOGS
    assert settings["database_name"] == "sahayak"
    print(f"  ✓ Database settings confirmed: DB name = '{settings['database_name']}'")


def test_module_imports_and_crud():
    print("[7/8] Testing module importability (connection, crud, package exports)...")
    import DB
    import DB.connection as conn
    import DB.crud as crud

    # Test top-level package export
    assert hasattr(DB, "crud")
    assert hasattr(DB, "get_db")
    assert hasattr(DB, "COLLECTION_USER_DOCUMENTS")
    assert hasattr(DB, "COLLECTION_NOTIFICATIONS")

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

    # User & Document CRUD helpers
    assert hasattr(crud, "create_user")
    assert hasattr(crud, "get_user_by_email")
    assert hasattr(crud, "get_user_by_id")
    assert hasattr(crud, "create_or_update_user_document")
    assert hasattr(crud, "get_user_documents")
    assert hasattr(crud, "get_user_document_by_type")
    assert hasattr(crud, "get_user_verified_document_types")
    assert hasattr(crud, "update_user_document_verification")
    assert hasattr(crud, "delete_user_document")

    # Eligibility & Notification helpers
    assert hasattr(crud, "save_eligibility_check")
    assert hasattr(crud, "get_latest_user_scheme_eligibility")
    assert hasattr(crud, "get_eligible_schemes_for_user")
    assert hasattr(crud, "get_non_eligible_schemes_for_user")
    assert hasattr(crud, "create_notification")
    assert hasattr(crud, "get_user_notifications")
    assert hasattr(crud, "mark_notification_as_read")
    assert hasattr(crud, "mark_all_notifications_read")
    assert hasattr(crud, "delete_notification")

    # Helper functions
    assert crud._to_str(NotificationType.SCHEME_NEW) == "SCHEME_NEW"
    assert crud._to_str(DocumentVerificationStatus.VERIFIED) == "verified"
    raw_doc = {"_id": "fake_mongo_id", "scheme_id": "pm_kisan", "name": "PM Kisan"}
    serialized = crud._serialize_doc(raw_doc)
    assert serialized is not None
    assert "id" in serialized
    assert "_id" not in serialized
    print("  ✓ All module exports, crud repositories, and serialization helpers verified.")


def test_indexes_and_seed_accounts():
    print("[8/8] Testing index definitions and seed user accounts...")
    import inspect
    import DB.seed as seed_module

    source_seed = inspect.getsource(seed_module.seed_demo_users)
    assert "citizen@sahayak.gov.in" in source_seed
    assert "officer@sahayak.gov.in" in source_seed
    assert "admin@sahayak.gov.in" in source_seed

    source_idx = inspect.getsource(seed_module.setup_indexes)
    assert "COLLECTION_USER_DOCUMENTS" in source_idx
    assert "COLLECTION_NOTIFICATIONS" in source_idx
    assert "COLLECTION_SCHEMES" in source_idx
    print("  ✓ Confirmed seed demo accounts and index definitions for user_documents & notifications.")


if __name__ == "__main__":
    print("=" * 65)
    print("Running SAHAYAK Database Layer Updated Workflow Verification Tests")
    print("=" * 65)
    test_seed_json_integrity()
    test_user_and_document_schemas()
    test_scheme_and_rules_schemas()
    test_explainable_eligibility_models()
    test_notification_schemas()
    test_config_and_collections()
    test_module_imports_and_crud()
    test_indexes_and_seed_accounts()
    print("=" * 65)
    print("🎉 ALL 8 DATABASE TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)
