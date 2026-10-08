# 🇮🇳 SAHAYAK Frontend — Citizen Entitlement & Welfare Platform

Modern, document-centric welfare discovery and entitlement platform built with **React**, **Vite**, **Tailwind CSS v4**, and **React Router**.

---

## 🚀 Quickstart

### 1. Install & Run
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Production Build Verification
```bash
npm run build
npm run preview
```

---

## 🏛️ Architecture & Document-Centric Workflow

The platform operates on a **transparent, document-centric entitlement model**:
1. **Citizen Document Locker**:
   - Citizens upload official documents (Aadhaar, Land Records, Bank Account/Passbook, Income Certificate, etc.).
   - Interactive document locker provides search, verification status filters (`ALL` / `VERIFIED` / `MISSING`), and pagination.
2. **Instant Scheme Matching & Visual Eligibility**:
   - As certificates are uploaded or updated, eligibility across 30+ Central and State welfare programs is dynamically re-evaluated.
   - Eligible schemes are flagged with green badges and instant application routes.
   - Ineligible schemes present a **transparent checklist** with visual cross icons (❌) explaining missing documents or unmet criteria (e.g., land threshold, domicile state).
3. **Notification Hub**:
   - Notifications trigger automatically when newly uploaded documents unlock schemes.
   - Synchronizes with `/notifications` API with fallback to local persistent storage.
4. **Master Admin Policy Console**:
   - Dedicated dashboard for administrators to create, gazette, and toggle schemes without citizen upload clutter.
   - Comprehensive system audit logs, policy enforcement, and live metrics.

---

## 🔌 API & Database Layer Compatibility (`backend/DB`)

The frontend services in `src/services/api.js` are designed to connect seamlessly to the FastAPI backend bridge communicating with `backend/DB`:

### Canonical Document Key Mapping
| UI Document ID (`documentsData.js`) | MongoDB Key (`backend/DB/schemas.py`) | Description |
| :--- | :--- | :--- |
| `aadhaar` | `aadhaar` | UIDAI Biometric Identity |
| `pan` | `pan` | Permanent Account Number |
| `bank_passbook` | `bank_account` | DBT-linked Bank Account |
| `land_record` | `land_record` | Khasra-Khatauni / 7/12 Land Records |
| `income_cert` | `income_certificate` | Tehsildar Income Certificate |
| `caste_cert` | `caste_certificate` | SC/ST/OBC/EWS Certificate |
| `domicile` | `domicile_certificate` | State Residence Proof |
| `ration_card` | `ration_card` | NFSA / State Ration Card |
| `mobile_number` | `mobile_number` | Aadhaar-Linked Mobile |

### Expected Backend Bridge Endpoints
* `GET /documents` & `POST /documents/upload` & `DELETE /documents/{doc_type}`
* `GET /schemes` & `GET /schemes/{id}` & `POST /schemes`
* `POST /eligibility/check`
* `GET /notifications` & `PUT /notifications/{id}/read` & `PUT /notifications/read-all`

---

## 📁 Source Code Structure
```text
frontend/
├── src/
│   ├── components/       # DocumentManager, SchemeEligibilityCard, NotificationBell, etc.
│   ├── context/          # AuthContext (Role-based), NotificationContext
│   ├── data/             # documentsData.js, schemes.js, profile.js
│   ├── pages/            # CitizenDashboardPage, AdminDashboardPage, SchemeDirectoryPage, etc.
│   ├── services/         # api.js (Universal HTTP client), eligibilityService.js (Rule engine)
│   └── utils/            # Multi-language translations (English & Hindi)
├── package.json
└── vite.config.js
```
