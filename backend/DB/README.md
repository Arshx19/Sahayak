# Database Layer — SAHAYAK

MongoDB configurations, Pydantic data schemas, async repository CRUD helpers, and seed datasets for the **SAHAYAK** platform.

---

## 📁 Directory Structure

```text
backend/DB/
├── __init__.py           # Package exports (Collections, schemas, and CRUD repositories)
├── config.py             # MongoDB URI & collection name constants (users, user_documents, schemes, etc.)
├── connection.py         # Async Motor and Sync PyMongo connection clients
├── schemas.py            # Pydantic data models & contracts (Users, Documents, Schemes, Rules, Eligibility, Notifications, Grievances)
├── crud.py               # Async CRUD helper repository for Backend (CRUD-API) & Rules Engine
├── seed.py               # Database seeder & index generation script
├── requirements.txt      # Python dependencies for MongoDB & Pydantic
├── test_db_layer.py      # Database layer self-verification test suite
└── seeds/
    ├── schemes_data.json # 10 seeded Indian government schemes (with provider, timeline, and document requirements)
    └── rules_data.json   # Deterministic eligibility rules for all 10 schemes
```

---

## 🚀 Quickstart for Team Members

### 1. Install Dependencies
```bash
pip install -r backend/DB/requirements.txt
```
*(Dependencies: `motor`, `pymongo`, `pydantic`, `python-dotenv`, `fastapi`)*

### 2. Configure Environment Variable
In your project `.env` or system environment, set:
```bash
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"
MONGO_DB_NAME="sahayak"
```
*(If unset, it automatically defaults to `mongodb://localhost:27017` and `sahayak`).*

### 3. Populate Database & Create Indexes
Run the seeder script to populate all 10 schemes, rules, and demo accounts:
```bash
python3 backend/DB/seed.py
```

### 4. Run Self-Verification Tests
```bash
python3 backend/DB/test_db_layer.py
```

---

## 🤝 Updated Workflow Data Contracts

### 📄 Document-Centric Citizen Workflow (`user_documents`)
User accounts interact with government schemes primarily through uploaded/verified documents rather than raw voice extractions:

```json
{
  "document_id": "doc_abc123",
  "user_id": "usr_demo_citizen",
  "document_type": "aadhaar",
  "document_name": "Aadhaar Card",
  "document_number": "XXXX-XXXX-1234",
  "verification_status": "verified",
  "status": "active",
  "file_url": "https://storage.sahayak.gov.in/docs/aadhaar_1234.pdf",
  "uploaded_at": "2026-10-07T12:00:00Z",
  "metadata": {
    "state": "Uttar Pradesh"
  }
}
```

### 🏛️ Government Schemes (`schemes`)
Schemes are designed to cleanly map to future Excel imports:
- `provider`: "Centre", "State", or "Centre + State"
- `timeline`: Application periods, validity, and disbursement cycles
- `required_documents`: Standardized document types required for application
- `applicable_states`: Array of applicable state names or `["ALL"]`

### ⚖️ Explainable Eligibility Model (`eligibility_checks`)
Eligibility outcomes preserve machine-readable criteria failure reasons:
```json
{
  "user_id": "usr_demo_citizen",
  "scheme_id": "pm_kisan",
  "is_eligible": false,
  "criteria_results": [
    {
      "criterion": "PAN_CARD",
      "status": "missing",
      "passed": false,
      "reason": "PAN Card has not been uploaded"
    },
    {
      "criterion": "STATE",
      "status": "failed",
      "passed": false,
      "expected": "Rajasthan",
      "actual": "Uttar Pradesh",
      "reason": "This scheme is only available in Rajasthan"
    }
  ],
  "missing_documents": ["pan"],
  "reasons": ["PAN Card has not been uploaded", "This scheme is only available in Rajasthan"]
}
```

### 🔔 User Notifications (`notifications`)
When schemes are added or updated, affected users receive targeted notifications:
- `notification_type`: `SCHEME_NEW`, `SCHEME_UPDATED`, `DOCUMENT_VERIFIED`, etc.
- Isolated per `user_id` with `is_read` status.

---

## 🏛️ Seeded Government Schemes (10 Total)

| ID | Scheme Code | Scheme Name | Category | Provider | Primary Required Documents |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `pm_kisan` | Pradhan Mantri Kisan Samman Nidhi | Agriculture | Centre | `aadhaar`, `land_record`, `bank_account_passbook` |
| 2 | `pm_jay` | Ayushman Bharat - PM-JAY | Healthcare | Centre + State | `aadhaar`, `ration_card`, `income_certificate` |
| 3 | `pmay_g` | Pradhan Mantri Awaas Yojana - Gramin | Housing | Centre + State | `aadhaar`, `mgnrega_job_card`, `land_record` |
| 4 | `pmuy` | Pradhan Mantri Ujjwala Yojana 2.0 | Clean Fuel | Centre | `aadhaar`, `ration_card`, `bank_account_passbook` |
| 5 | `apy` | Atal Pension Yojana | Social Security | Centre | `aadhaar`, `bank_account_passbook`, `mobile_number` |
| 6 | `ignoaps` | Indira Gandhi National Old Age Pension | Social Assistance | Centre + State | `aadhaar`, `age_proof`, `income_certificate` |
| 7 | `ssy` | Sukanya Samriddhi Yojana | Savings | Centre | `birth_certificate`, `aadhaar`, `photograph` |
| 8 | `mgnrega` | MGNREGA Rural Employment Guarantee | Employment | Centre + State | `aadhaar`, `photograph`, `bank_account_passbook` |
| 9 | `pmmy` | Pradhan Mantri Mudra Yojana | MSME / Loans | Centre | `aadhaar`, `pan`, `bank_account_statement` |
| 10 | `pmsvanidhi` | PM SVANidhi | Urban Livelihoods | Centre | `aadhaar`, `vending_certificate` |
