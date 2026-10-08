"""Automated Verification Test Suite for SAHAYAK CRUD / API Service.

Validates the full REST API layer bridging React Frontend to backend/DB:
- 1. Root & Health Check probes (/ and /health)
- 2. Authentication & JWT Issuance (/auth/register, /auth/login)
- 3. User Account Self-Service (/users/me)
- 4. Citizen Demographic Profiles (/profile, /profile/me)
- 5. Citizen Document Locker (/documents, /documents/upload, /documents/{type})
- 6. In-App Notifications Hub (/notifications, /notifications/{id}/read, /notifications/read-all)
- 7. Government Schemes Directory (/schemes, state/category filters, case-insensitive ID/alias lookup)
- 8. Scheme Rules Authoring (/schemes/{id}/rules)
- 9. Deterministic Explainable Eligibility (/eligibility/check, /eligibility/my-schemes)
- 10. Grievance Redressal & Officer Workflow (/grievances, /grievances/my, status transitions)
"""

import os
import sys
from pathlib import Path
from typing import Any, Dict

# Set low timeout for offline test resilience
os.environ["MONGO_TIMEOUT_MS"] = "200"

# Ensure paths are configured
repo_root = Path(__file__).resolve().parent.parent.parent
backend_dir = Path(__file__).resolve().parent.parent
crud_dir = Path(__file__).resolve().parent
for p in (str(repo_root), str(backend_dir), str(crud_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

import pytest
from fastapi.testclient import TestClient

from crud.main import app
from crud.auth.jwt import create_access_token


@pytest.fixture
def client():
    """Create test client instance."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def citizen_token():
    return create_access_token(user_id="usr_citizen_001", role="citizen")


@pytest.fixture
def officer_token():
    return create_access_token(user_id="usr_officer_001", role="officer")


@pytest.fixture
def admin_token():
    return create_access_token(user_id="usr_admin_001", role="admin")


# =============================================================================
# 1. Root & Health Check Tests
# =============================================================================

def test_root_and_health(client: TestClient):
    """Verify service root and health probe endpoints."""
    r_root = client.get("/")
    assert r_root.status_code == 200
    data_root = r_root.json()
    assert data_root["success"] is True
    assert "SAHAYAK CRUD/API" in data_root["message"]

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"


# =============================================================================
# 2. Auth Flow Tests (Register, Duplicate Check, Login)
# =============================================================================

def test_auth_registration_and_login(client: TestClient):
    """Test user registration with state/district, JWT login, and token issuance."""
    test_email = "citizen.sunita@sahayak.gov.in"
    reg_payload = {
        "name": "Sunita Patil",
        "email": test_email,
        "password": "SecurePassword123!",
        "role": "citizen",
        "phone": "+919876543210",
        "state": "Maharashtra",
        "district": "Satara",
    }

    # 1. Registration
    r_reg = client.post("/auth/register", json=reg_payload)
    assert r_reg.status_code == 201
    reg_data = r_reg.json()
    assert reg_data["success"] is True
    assert reg_data["data"]["email"] == test_email
    assert reg_data["data"]["state"] == "Maharashtra"
    assert reg_data["data"]["district"] == "Satara"

    # 2. Login
    login_payload = {
        "email": test_email,
        "password": "SecurePassword123!",
    }
    r_login = client.post("/auth/login", json=login_payload)
    assert r_login.status_code == 200
    login_data = r_login.json()
    assert login_data["success"] is True
    assert "access_token" in login_data["data"]
    assert login_data["data"]["token_type"] == "bearer"
    assert "user" in login_data["data"]
    assert login_data["data"]["user"]["email"] == test_email


# =============================================================================
# 3. User Account Self-Service Tests
# =============================================================================

def test_user_me_flow(client: TestClient, citizen_token: str):
    """Test user retrieval, update, and soft deletion."""
    headers = {"Authorization": f"Bearer {citizen_token}"}

    # GET /users/me
    r_get = client.get("/users/me", headers=headers)
    assert r_get.status_code == 200
    get_data = r_get.json()
    assert get_data["success"] is True
    assert get_data["data"]["user_id"] == "usr_citizen_001"

    # PUT /users/me
    update_payload = {"name": "Updated Citizen Name", "phone": "+919999999999"}
    r_put = client.put("/users/me", json=update_payload, headers=headers)
    assert r_put.status_code == 200
    put_data = r_put.json()
    assert put_data["success"] is True
    assert put_data["data"]["name"] == "Updated Citizen Name"

    # DELETE /users/me
    r_del = client.delete("/users/me", headers=headers)
    assert r_del.status_code == 200
    assert "deleted successfully" in r_del.json()["message"]


# =============================================================================
# 4. Citizen Demographic Profiles Tests
# =============================================================================

def test_citizen_profiles(client: TestClient, citizen_token: str):
    """Test citizen demographic profile upsert, retrieval, and delete."""
    headers = {"Authorization": f"Bearer {citizen_token}"}

    profile_payload = {
        "name": "Sunita Patil",
        "age": 42,
        "gender": "female",
        "occupation": "farmer",
        "annual_income": 95000.0,
        "land_acres": 1.5,
        "state": "Maharashtra",
        "district": "Satara",
        "documents": ["aadhaar", "land_record"],
        "consent": True,
    }

    # POST /profile
    r_post = client.post("/profile", json=profile_payload, headers=headers)
    assert r_post.status_code == 201
    assert r_post.json()["success"] is True

    # GET /profile/me
    r_get = client.get("/profile/me", headers=headers)
    assert r_get.status_code == 200
    assert r_get.json()["data"]["user_id"] == "usr_citizen_001"

    # PUT /profile/me
    r_put = client.put(
        "/profile/me",
        json={"annual_income": 105000.0, "land_acres": 2.0},
        headers=headers,
    )
    assert r_put.status_code == 200
    assert r_put.json()["success"] is True

    # DELETE /profile/me
    r_del = client.delete("/profile/me", headers=headers)
    assert r_del.status_code == 200
    assert "deleted successfully" in r_del.json()["message"]


# =============================================================================
# 5. Citizen Document Locker Tests
# =============================================================================

def test_citizen_document_locker(client: TestClient, citizen_token: str):
    """Test document retrieval, upload with key normalization, and deletion."""
    headers = {"Authorization": f"Bearer {citizen_token}"}

    # 1. GET /documents initially
    r_list = client.get("/documents", headers=headers)
    assert r_list.status_code == 200
    assert r_list.json()["success"] is True
    assert isinstance(r_list.json()["data"], list)

    # 2. Upload document with alias: bank_passbook -> normalized to bank_account
    upload_bank = {
        "document_type": "bank_passbook",
        "document_name": "State Bank of India Passbook",
        "document_number": "SBIN0001234",
        "file_name": "sbi_passbook.pdf",
        "file_url": "https://storage.sahayak.gov.in/docs/bank_001.pdf",
        "verification_status": "verified",
    }
    r_upload1 = client.post("/documents/upload", json=upload_bank, headers=headers)
    assert r_upload1.status_code == 201
    data_upload1 = r_upload1.json()
    assert data_upload1["success"] is True
    assert data_upload1["data"]["document_type"] == "bank_account"

    # 3. Upload document with alias: income_cert -> normalized to income_certificate
    upload_inc = {
        "document_type": "income_cert",
        "document_name": "Tehsildar Income Certificate",
        "document_number": "INC-2026-9876",
        "file_name": "income_cert_2026.pdf",
        "verification_status": "verified",
    }
    r_upload2 = client.post("/documents/upload", json=upload_inc, headers=headers)
    assert r_upload2.status_code == 201
    data_upload2 = r_upload2.json()
    assert data_upload2["success"] is True
    assert data_upload2["data"]["document_type"] == "income_certificate"

    # 4. DELETE /documents/{document_type} with alias
    r_del = client.delete("/documents/bank_passbook", headers=headers)
    assert r_del.status_code == 200
    assert r_del.json()["success"] is True


# =============================================================================
# 6. In-App Notifications Hub Tests
# =============================================================================

def test_notifications_hub(client: TestClient, citizen_token: str):
    """Test user notification listing, single read, and mark all as read."""
    headers = {"Authorization": f"Bearer {citizen_token}"}

    # 1. GET /notifications
    r_notifs = client.get("/notifications", headers=headers)
    assert r_notifs.status_code == 200
    assert r_notifs.json()["success"] is True
    assert isinstance(r_notifs.json()["data"], list)

    # 2. PUT /notifications/{id}/read
    r_read_single = client.put("/notifications/notif_001/read", headers=headers)
    assert r_read_single.status_code == 200
    assert r_read_single.json()["success"] is True

    # 3. PUT /notifications/read-all
    r_read_all = client.put("/notifications/read-all", headers=headers)
    assert r_read_all.status_code == 200
    assert r_read_all.json()["success"] is True


# =============================================================================
# 7. Schemes Directory & State/Category Filtering Tests
# =============================================================================

def test_schemes_listing_and_filtering(client: TestClient, admin_token: str, citizen_token: str):
    """Test scheme directory listing with 30 schemes, filtering, alias lookup, and admin CRUD."""
    # 1. Public scheme discovery returns list with required fields
    r_list = client.get("/schemes")
    assert r_list.status_code == 200
    schemes = r_list.json()["data"]
    assert len(schemes) >= 1
    sample = schemes[0]
    for required_field in (
        "scheme_id",
        "name",
        "category",
        "provider",
        "applicable_states",
        "timeline",
        "description",
        "required_documents",
        "official_url",
    ):
        assert required_field in sample, f"Missing required field {required_field} in scheme model"

    # 2. State-specific filter
    r_state = client.get("/schemes?state=Maharashtra")
    assert r_state.status_code == 200
    assert len(r_state.json()["data"]) >= 1

    # 3. Category filter
    r_cat = client.get("/schemes?category=Farmer")
    assert r_cat.status_code == 200

    # 4. Lookup by standard ID (CEN001)
    r_cen = client.get("/schemes/CEN001")
    assert r_cen.status_code == 200
    assert "CEN001" in r_cen.json()["data"]["scheme_id"]

    # 5. Lookup by alias (pm_kisan)
    r_pmkisan = client.get("/schemes/pm_kisan")
    assert r_pmkisan.status_code == 200
    assert r_pmkisan.json()["data"]["scheme_id"] == "pm_kisan"

    # 6. RBAC: Citizen cannot create scheme
    new_scheme = {
        "scheme_code": "TEST-SCHEME-2026",
        "name": "Test Welfare Scheme",
        "description": "Scheme for test verification",
        "category": "Social Security",
        "scheme_type": "Central",
        "applicable_states": ["ALL"],
        "benefits": "Financial benefit",
        "required_documents": ["aadhaar"],
    }
    r_forbidden = client.post(
        "/schemes",
        json=new_scheme,
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert r_forbidden.status_code == 403

    # 7. Admin CAN create scheme
    r_create = client.post(
        "/schemes",
        json=new_scheme,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r_create.status_code == 201
    assert r_create.json()["success"] is True

    # 8. Admin CAN update scheme
    r_update = client.put(
        "/schemes/TEST-SCHEME-2026",
        json={"name": "Updated Test Welfare Scheme"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r_update.status_code == 200

    # 9. Admin CAN delete scheme
    r_delete = client.delete(
        "/schemes/TEST-SCHEME-2026",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r_delete.status_code == 200
    assert "deactivated successfully" in r_delete.json()["message"]


# =============================================================================
# 8. Scheme Rules Authoring Tests
# =============================================================================

def test_scheme_rules_authoring(client: TestClient, admin_token: str, citizen_token: str):
    """Test rules listing and admin creation."""
    # List rules
    r_rules = client.get("/schemes/CEN001/rules")
    assert r_rules.status_code == 200
    rules_data = r_rules.json()["data"]
    assert "rules" in rules_data

    # Citizen blocked from adding rules
    rule_payload = {
        "field": "age",
        "operator": ">=",
        "value": 18,
        "explanation": "Applicant must be at least 18 years old",
    }
    r_blocked = client.post(
        "/schemes/CEN001/rules",
        json=rule_payload,
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert r_blocked.status_code == 403

    # Admin allowed to add rule
    r_admin_add = client.post(
        "/schemes/CEN001/rules",
        json=rule_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r_admin_add.status_code == 201
    assert r_admin_add.json()["success"] is True


# =============================================================================
# 9. Deterministic Explainable Eligibility Tests
# =============================================================================

def test_eligibility_flow(client: TestClient, citizen_token: str):
    """Test deterministic evaluation endpoint and my-schemes aggregation."""
    headers = {"Authorization": f"Bearer {citizen_token}"}

    # 1. POST /eligibility/check
    check_payload = {
        "scheme_id": "pm_kisan",
        "profile_override": {
            "occupation": "farmer",
            "land_acres": 2.0,
            "annual_income": 120000.0,
            "state": "Maharashtra",
        },
    }
    r_check = client.post("/eligibility/check", json=check_payload, headers=headers)
    assert r_check.status_code == 200
    check_data = r_check.json()
    assert check_data["success"] is True
    assert "data" in check_data
    result = check_data["data"]
    assert "is_eligible" in result
    assert "criteria" in result or "criteria_results" in result
    assert "reasons" in result

    # 2. GET /eligibility/my-schemes
    r_my_schemes = client.get("/eligibility/my-schemes", headers=headers)
    assert r_my_schemes.status_code == 200
    my_data = r_my_schemes.json()
    assert my_data["success"] is True
    assert "eligible" in my_data["data"]
    assert "ineligible" in my_data["data"]


# =============================================================================
# 10. Grievance Redressal & Officer Workflow Tests
# =============================================================================

def test_grievance_workflow(
    client: TestClient,
    citizen_token: str,
    officer_token: str,
):
    """Test grievance submission, citizen ownership, officer assignment, and status transition."""
    # 1. Citizen files grievance
    grievance_payload = {
        "scheme_id": "pm_kisan",
        "scheme_name": "PM Kisan Samman Nidhi",
        "complaint_text": "Installment payment delayed by 4 months",
        "priority": "HIGH",
        "department": "Agriculture & Farmers Welfare",
    }
    r_file = client.post(
        "/grievances",
        json=grievance_payload,
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert r_file.status_code == 201
    ticket = r_file.json()["data"]
    ticket_id = ticket["ticket_id"]
    assert ticket_id is not None

    # 2. Citizen views own grievances
    r_my = client.get(
        "/grievances/my",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert r_my.status_code == 200

    # 3. Citizen blocked from officer dashboard
    r_all_cit = client.get(
        "/grievances",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert r_all_cit.status_code == 403

    # 4. Officer views all grievances
    r_all_off = client.get(
        "/grievances",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert r_all_off.status_code == 200

    # 5. Citizen cannot assign officer
    r_cit_assign = client.put(
        f"/grievances/{ticket_id}/assign",
        json={"assigned_officer": "officer_sharma"},
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert r_cit_assign.status_code == 403

    # 6. Officer assigns officer to ticket
    r_off_assign = client.put(
        f"/grievances/{ticket_id}/assign",
        json={"assigned_officer": "officer_sharma"},
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert r_off_assign.status_code == 200
    assert r_off_assign.json()["success"] is True

    # 7. Officer advances status
    r_status = client.put(
        f"/grievances/{ticket_id}/status",
        json={"status": "IN_PROGRESS", "comment": "Under active verification with bank branch"},
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert r_status.status_code == 200
    assert r_status.json()["success"] is True

    # 8. Officer adds progress update
    r_upd = client.post(
        f"/grievances/{ticket_id}/update",
        json={"status": "RESOLVED", "comment": "Payment released via DBT"},
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert r_upd.status_code == 201
    assert r_upd.json()["success"] is True
