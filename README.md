# SAHAYAK (सहायक) 🇮🇳
### Multilingual AI-Powered Government Welfare Discovery & Grievance Redressal Platform

> **"Bridging Citizens and Public Welfare with Voice-First Multilingual AI & Deterministic Rules"**

---

## 🏛️ Project Overview

**SAHAYAK** is a next-generation civic technology platform designed to make government welfare schemes and citizen grievance redressal accessible to every Indian citizen regardless of literacy, language, or digital familiarity. 

By marrying **voice-first multilingual natural language understanding (Bhashini + LLM)** with a **100% deterministic rules engine ("LLM Understands, Rules Decide")**, SAHAYAK guarantees zero AI hallucinations in eligibility determinations while providing a seamless, conversational experience in native Indian languages.

---

## 📁 Repository Architecture

The repository is organized into cleanly decoupled, production-grade subsystems:

```text
Sahayak/
├── frontend/               # Vite + React 18 Citizen & Officer Web Portal
│   ├── src/
│   │   ├── components/     # UI Components (VoiceButton, GovernmentHeader, SchemeCard, etc.)
│   │   ├── pages/          # Pages (HomePage, SchemesPage, AssistantPage, OfficerDashboard, etc.)
│   │   ├── services/       # Frontend API client
│   │   └── data/           # Client-side fallbacks & multilingual translations
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── DB/                 # MongoDB Database Layer & Foundation
│   │   ├── config.py       # MongoDB Atlas / local connection settings & collections
│   │   ├── connection.py   # Motor (async) & PyMongo (sync) client connection pool
│   │   ├── schemas.py      # Pydantic entity models & database contracts
│   │   ├── crud.py         # Async repository methods for Users, Schemes, Rules, Grievances
│   │   ├── seed.py         # Database seeder with unique indexes & demo accounts
│   │   ├── seeds/          # 10 seeded Indian government schemes & deterministic rule sets
│   │   └── test_db_layer.py# Automated DB layer verification test suite
│   │
│   ├── crud/               # Core REST API / FastAPI Service
│   │   ├── main.py         # FastAPI application entrypoint with lifespan event handling
│   │   ├── auth/           # JWT token issuance, bcrypt hashing & RBAC dependencies
│   │   ├── routes/         # Modular routers (auth, users, schemes, rules, profiles, grievances)
│   │   ├── schemas/        # HTTP Request / Response DTO models
│   │   ├── requirements.txt# FastAPI, Motor, PyJWT, Passlib dependencies
│   │   └── test_crud_routes.py # 380+ lines test suite for API endpoints & RBAC
│   │
│   └── AI/                 # AI & Intelligence Layer
│       ├── bhashini/       # Bhashini STT, Translation, and TTS adapter service
│       ├── extractor/      # LLM-based citizen parameter extraction ("LLM Understands")
│       ├── rules_engine/   # Deterministic boolean criteria evaluation ("Rules Decide")
│       └── grievances/     # NLP grievance intent classification & urgency routing
│
├── .gitignore              # Repository git ignore rules
└── README.md               # Master project documentation (this file)
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18.0 or higher) & **npm**
- **Python** (v3.10 to v3.14)
- **MongoDB** (Local instance or MongoDB Atlas Cluster)

---

### 2. Database Setup (`backend/DB/`)
The database layer contains automated seeding and connection pooling for MongoDB.

```bash
cd backend/DB

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (or copy .env.example)
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string or keep default local URI

# Run seeder (populates 10 schemes, rules, indexes, and demo accounts)
python3 seed.py

# Run database verification test suite
python3 test_db_layer.py
```

#### Demo Accounts Seeded:
| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sahayak.gov.in` | `Admin@123` | Scheme & rule management, system audit |
| **Officer** | `officer@sahayak.gov.in` | `Officer@123` | Grievance resolution & officer dashboard |
| **Citizen** | `citizen@sahayak.gov.in` | `Citizen@123` | Scheme discovery, profile, grievance submission |

---

### 3. Backend API Service (`backend/crud/`)
The FastAPI backend serves all REST endpoints with JWT role-based access control (RBAC).

```bash
cd backend/crud

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn main:app --reload --port 8000
```
Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

### 4. Frontend Application (`frontend/`)
The responsive React frontend provides the voice-first citizen portal and the administrative officer dashboard.

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Access the application in your browser at `http://localhost:5173`.

---

## ⚖️ Architectural Doctrine: "LLM Understands, Rules Decide"

A critical design requirement of SAHAYAK is avoiding AI hallucinations in welfare eligibility.

1. **LLM Extraction**: Natural language speech (in Hindi, Tamil, Bengali, etc.) is transcribed and translated. An LLM extracts structured citizen demographics (`age`, `occupation`, `annual_income`, `land_acres`, etc.) conforming to `CitizenProfileCreate`.
2. **Deterministic Evaluation**: Eligibility is determined **exclusively** by evaluating the citizen's profile against deterministic criteria (`<`, `<=`, `==`, `in`) stored in `scheme_rules`.
3. **Auditability**: Every decision produces an audit trail containing `criteria_met` and `criteria_failed`, stored in MongoDB `eligibility_checks` for transparency.

---

## 🏛️ Seeded Government Schemes

| Scheme Code | Scheme Name | Category | Eligibility Threshold |
| :--- | :--- | :--- | :--- |
| `pm_kisan` | PM Kisan Samman Nidhi | Agriculture | Farmer with land, Income $\le$ ₹2.5L |
| `pm_jay` | Ayushman Bharat (PM-JAY) | Healthcare | Low income $\le$ ₹2.5L / BPL families |
| `pmay_g` | PM Awaas Yojana - Gramin | Housing | Rural households, Income $\le$ ₹3.0L |
| `pmuy` | PM Ujjwala Yojana 2.0 | Clean Fuel | Adult women (18+), Income $\le$ ₹2.0L |
| `apy` | Atal Pension Yojana | Social Security | Age 18–40, Unorganized workers |
| `ignoaps` | Indira Gandhi Old Age Pension | Social Assistance | Seniors (60+), Income $\le$ ₹1.5L |
| `ssy` | Sukanya Samriddhi Yojana | Savings | Families with girl child ($\le$ 10 yrs) |
| `mgnrega` | MGNREGA Employment Guarantee | Employment | Rural adults (18+) |
| `pmmy` | Pradhan Mantri Mudra Yojana | Micro-Enterprise | Small businesses, artisans, vendors |
| `pmsvanidhi` | PM SVANidhi | Urban Livelihoods | Urban street vendors (18+) |

---

## 🔐 Environment Variables Summary

Create a root or local `.env` file according to the templates provided:

```ini
# MongoDB Connection
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.rvlg8ic.mongodb.net/?retryWrites=true&w=majority&appName=SahayakCluster"
MONGO_DB_NAME="sahayak"

# JWT Authentication
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI & Bhashini (Mock fallback enabled by default)
BHASHINI_USE_MOCK=true
BHASHINI_API_KEY=""
GEMINI_API_KEY=""
```

---

## 🤝 Branching & Contribution Workflow

- **`main`**: Production-ready, stable codebase.
- **`feature/crud-api`**: Core FastAPI REST endpoints, RBAC auth, and test suites.
- **`feature/db-foundation`**: MongoDB connection pooling, Pydantic schemas, and data seeders.
- **`feature/ai-integration`**: Multilingual voice translation, LLM extraction, and deterministic rules engine.

---

## 📄 License
Developed for the **Shivalik / Sahayak Initiative**. Open-source under the MIT License.
