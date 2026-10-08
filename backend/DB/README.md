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

## 🏛️ Government Schemes Dataset (30 Total — Simplified 2026 MVP)

Directly compatible with `Government_Schemes_India_2026_SIMPLIFIED.xlsx`:

| Provider / State | Count | Schemes |
| :--- | :---: | :--- |
| **Central Government** | 10 | PM-KISAN, AB-PMJAY, PMAY-G, PMUY, APY, PMMY, PM SVANidhi, PMMVY, MGNREGS, SSY |
| **Uttar Pradesh** | 5 | MMYSY, Mukhyamantri Kanya Sumangala, ODOP Margin Money, UP Mukhyamantri Abhyudaya, Mukhyamantri Krishak Durghatna Kalyan |
| **Maharashtra** | 5 | Mukhyamantri Majhi Ladki Bahin, MJPJAY, MSKVY 2.0, Mukhyamantri Vayoshri, RCSM Fee Reimbursement |
| **Karnataka** | 5 | Gruha Lakshmi, Gruha Jyothi, Yuva Nidhi, Anna Bhagya, Shakti Scheme |
| **Odisha** | 5 | Subhadra Yojana, KALIA, Gopabandhu Jan Arogya (GJAY), Madhu Babu Pension (MBPY), Biju Yuva Sashaktikaran |
| **Total** | **30** | *10 Central + 5 UP + 5 MH + 5 KA + 5 OD* |

### Excel-to-Database Seeder
The database seeder in `backend/DB/seed.py` dynamically checks for `Government_Schemes_India_2026_SIMPLIFIED.xlsx` and normalizes canonical document requirements directly into the `schemes` and `scheme_rules` collections.
