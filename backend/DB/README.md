# Database Layer — SAHAYAK

MongoDB configurations, Pydantic data schemas, async repository CRUD helpers, and seed datasets for the **SAHAYAK** platform.

---

## 📁 Directory Structure

```text
backend/DB/
├── __init__.py           # Package exports
├── config.py             # MongoDB URI & collection name constants
├── connection.py         # Async Motor and Sync PyMongo connection clients
├── schemas.py            # Pydantic data models & contracts (Users, Profiles, Schemes, Rules, Grievances)
├── crud.py               # Async CRUD helper repository for Backend (CRUD-API) & AI
├── seed.py               # Database seeder & index generation script
├── requirements.txt      # Python dependencies for MongoDB & Pydantic
└── seeds/
    ├── schemes_data.json # 10 seeded Indian government schemes
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
MONGO_DB_NAME="sahayak_db"
```
*(If unset, it automatically defaults to `mongodb://localhost:27017` and `sahayak_db`).*

### 3. Populate Database & Create Indexes
Run the seeder script to populate all 10 schemes, rules, and demo accounts:
```bash
python3 backend/DB/seed.py
```

---

## 🤝 Team Integration Guide

### 🤖 For AI Developers: Citizen Profile Extraction Contract
When your voice / LLM pipeline extracts citizen parameters from natural speech, map them to these exact field names defined in `backend/DB/schemas.py`:

```json
{
  "age": 62,
  "gender": "male",
  "occupation": "farmer",
  "annual_income": 180000,
  "land_acres": 1.5,
  "state": "Uttar Pradesh",
  "district": "Varanasi",
  "area_type": "rural",
  "caste_category": "general",
  "is_bpl": false,
  "is_differently_abled": false,
  "has_girl_child": false,
  "girl_child_age": null,
  "raw_voice_transcript": "Meri age 62 hai, main farmer hoon, meri income 1.8 lakh hai aur 1.5 acre zameen hai."
}
```

### ⚙️ For Backend Developers: Connecting to DB Layer
Import repository helpers and the database session dependency into your routes:

```python
from fastapi import APIRouter, Depends
from DB.connection import get_db
import DB.crud as db_crud

router = APIRouter(prefix="/schemes", tags=["Schemes"])

@router.get("/")
async def list_schemes(db = Depends(get_db)):
    schemes = await db_crud.get_all_schemes(db, is_active=True)
    return schemes
```

---

## 🏛️ Seeded Government Schemes (10 Total)

| ID | Scheme Code | Scheme Name | Category | Primary Target |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `pm_kisan` | Pradhan Mantri Kisan Samman Nidhi | Agriculture | Farmers with land, Income <= ₹2.5L |
| 2 | `pm_jay` | Ayushman Bharat - PM-JAY | Healthcare | Low income <= ₹2.5L / BPL families |
| 3 | `pmay_g` | Pradhan Mantri Awaas Yojana - Gramin | Housing | Rural households, Income <= ₹3L |
| 4 | `pmuy` | Pradhan Mantri Ujjwala Yojana 2.0 | Clean Fuel | Adult women (18+), Income <= ₹2L |
| 5 | `apy` | Atal Pension Yojana | Social Security | Age 18–40, Unorganized workers |
| 6 | `ignoaps` | Indira Gandhi National Old Age Pension | Social Assistance | Senior citizens (60+), Income <= ₹1.5L |
| 7 | `ssy` | Sukanya Samriddhi Yojana | Savings | Families with girl child (<= 10 yrs) |
| 8 | `mgnrega` | MGNREGA Rural Employment Guarantee | Employment | Rural adults (18+) |
| 9 | `pmmy` | Pradhan Mantri Mudra Yojana | MSME / Loans | Small businesses, artisans, vendors |
| 10 | `pmsvanidhi` | PM SVANidhi | Urban Livelihoods | Urban street vendors (18+) |

---

## ⚖️ Rules Engine Contract: "LLM Understands, Rules Decide"

Each scheme has deterministic rules stored in `scheme_rules`.
Example (`pm_kisan`):
- `occupation == "farmer"`
- `land_acres > 0.0`
- `annual_income <= 250000`

The AI pipeline extracts the profile; the Rules Engine queries `crud.get_scheme_rules(scheme_id)` and evaluates these boolean criteria.
