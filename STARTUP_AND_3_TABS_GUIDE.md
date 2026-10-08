# 🚀 SAHAYAK (सहायक) - Complete Startup & 3-Tabs Usage Guide

This guide contains **all the code and commands** required to run the Backend and Frontend, as well as a step-by-step walkthrough on how to **use and test the platform across 3 tabs (Citizen, Officer, and Admin)** simultaneously.

---

## 📋 Table of Contents
1. [One-Click Startup Script (Quickest)](#1-one-click-startup-script)
2. [Manual Commands for 3 Terminal Tabs](#2-manual-commands-for-3-terminal-tabs)
3. [How to Use the 3 Browser Tabs (Citizen, Officer, Admin)](#3-how-to-use-the-3-browser-tabs)
4. [Live 3-Tab Interaction Test Workflow](#4-live-3-tab-interaction-test-workflow)
5. [Demo Credentials Summary](#5-demo-credentials-summary)
6. [Troubleshooting & Ports](#6-troubleshooting--ports)

---

## 1. One-Click Startup Script

You can double-click **`START_SAHAYAK.bat`** in the project root directory, or execute it in PowerShell:

```powershell
.\START_SAHAYAK.bat
```

This automatically opens two dedicated terminal windows:
- **Terminal 1**: Backend FastAPI API on `http://localhost:8000`
- **Terminal 2**: Frontend React Vite Server on `http://localhost:5173`

---

## 2. Manual Commands for 3 Terminal Tabs

If you prefer using separate terminal tabs (e.g. in VS Code, Windows Terminal, or PowerShell), open 3 terminal tabs and run the following:

### 📟 Terminal Tab 1: Database Seeding & Verification (Optional / First Time)
Verifies MongoDB Atlas connection and seeds the 10 welfare schemes, deterministic rules, and demo accounts:

```powershell
# Navigate to database directory
cd c:\Users\arshj\OneDrive\Desktop\Sahayak\backend\DB

# Run database seeder
python seed.py

# (Optional) Verify test suite
python test_db_layer.py
```

---

### 📟 Terminal Tab 2: Start Backend (FastAPI REST Service)
Starts the FastAPI backend on port 8000 with auto-reload:

```powershell
# Navigate to CRUD directory
cd c:\Users\arshj\OneDrive\Desktop\Sahayak\backend\crud

# Start the uvicorn development server
python -m uvicorn main:app --reload --port 8000
```
- **Backend URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc API Spec**: `http://localhost:8000/redoc`

---

### 📟 Terminal Tab 3: Start Frontend (React + Vite)
Starts the Vite dev server with Hot Module Replacement (HMR):

```powershell
# Navigate to frontend directory
cd c:\Users\arshj\OneDrive\Desktop\Sahayak\frontend

# Install dependencies if not already done
npm install

# Start Vite frontend
npm run dev
```
- **Frontend URL**: `http://localhost:5173`

---

## 3. How to Use the 3 Browser Tabs

SAHAYAK is designed with **3 distinct Role-Based Portals**:
1. 🧑‍🌾 **Citizen Portal** (`/citizen`)
2. 👔 **Nodal Officer Portal** (`/officer`)
3. 🛡️ **Administrator Portal** (`/admin`)

> ⚠️ **IMPORTANT BROWSER ISOLATION RULE**:
> Web browsers share `localStorage` (where the JWT session token is stored) across regular tabs in the same window. If you log into Citizen in Tab 1 and then log into Admin in Tab 2 within the same normal browser window, Tab 2 will overwrite the session of Tab 1.
>
> **To use all 3 roles simultaneously at the same time, open them in isolated sessions:**

---

### 🗂️ TAB 1: Citizen Portal (Normal Browser Window)
1. Open your regular browser window (Chrome, Edge, or Brave).
2. Go to: **`http://localhost:5173/login`**
3. Log in with **Citizen Credentials**:
   - **Email**: `citizen@sahayak.gov.in`
   - **Password**: `Citizen@123`
4. You will be redirected to the **Citizen Dashboard** (`http://localhost:5173/citizen`).
5. **What Citizen Can Do in Tab 1**:
   - Check eligibility for government schemes (PM-Kisan, Ayushman Bharat, PMAY, etc.).
   - Upload demographic documents to the Digilocker vault.
   - Use the Multilingual Voice Assistant (`/assistant`).
   - Register a Grievance (`/grievances`) and receive a tracking ticket ID.

---

### 🗂️ TAB 2: Nodal Officer Portal (Incognito / InPrivate Window)
1. Open an **Incognito / InPrivate Window** (`Ctrl + Shift + N` in Chrome/Edge).
2. Go to: **`http://localhost:5173/login`**
3. Log in with **Officer Credentials**:
   - **Email**: `officer@sahayak.gov.in`
   - **Password**: `Officer@123`
4. You will be redirected to the **Officer Dashboard** (`http://localhost:5173/officer`).
5. **What Officer Can Do in Tab 2**:
   - View all grievances filed by citizens in real-time.
   - Filter by Department, Priority, or Urgency.
   - Update grievance status: `Under Review` ➡️ `In Progress` ➡️ `Resolved`.
   - Add official remarks and resolution notes.

---

### 🗂️ TAB 3: Administrator Portal (Guest Window OR Second Browser)
1. Open a **Guest Window** (Click Profile icon ➡️ Open Guest Window) OR open a **different browser** (e.g. Edge if you used Chrome for Tab 1).
2. Go to: **`http://localhost:5173/login`**
3. Log in with **Admin Credentials**:
   - **Email**: `admin@sahayak.gov.in`
   - **Password**: `Admin@123`
4. You will be redirected to the **Admin Governance Console** (`http://localhost:5173/admin`).
5. **What Admin Can Do in Tab 3**:
   - Publish or edit government welfare schemes.
   - Configure deterministic eligibility rules ("Rules Decide" engine).
   - Inspect system audit logs and grievance SLA metrics across departments.

---

## 4. Live 3-Tab Interaction Test Workflow

Try this end-to-end multi-role test to see the 3 tabs interacting live:

```text
 ┌──────────────────────────────────────────────────────────────┐
 │ [Tab 1: Citizen]                                              │
 │ Files a Grievance for "Delay in PM-Kisan 16th Installment"   │
 └──────────────────────────────┬───────────────────────────────┘
                                │ (Saved in MongoDB Atlas)
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ [Tab 2: Officer]                                             │
 │ Sees new Grievance appear, marks status as "In Progress",     │
 │ and posts official remark: "Verified land record with Patwari"│
 └──────────────────────────────┬───────────────────────────────┘
                                │ (Status updated)
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ [Tab 3: Admin]                                               │
 │ Inspects departmental resolution analytics and grievance SLAs│
 └──────────────────────────────────────────────────────────────┘
```

1. **In Tab 1 (Citizen)**: Go to `/grievances`, submit a new complaint. Note down the Grievance ID.
2. **In Tab 2 (Officer)**: Refresh or view the list. Open the grievance, update status to `In Progress` or `Resolved`, and submit an action note.
3. **In Tab 1 (Citizen)**: Check your grievance status — see that the status and officer's remarks are updated!
4. **In Tab 3 (Admin)**: Check `/admin` to verify system statistics and audit trail.

---

## 5. Demo Credentials Summary

| Role | Portal URL | Email | Password |
| :--- | :--- | :--- | :--- |
| **Citizen** | `http://localhost:5173/citizen` | `citizen@sahayak.gov.in` | `Citizen@123` |
| **Nodal Officer** | `http://localhost:5173/officer` | `officer@sahayak.gov.in` | `Officer@123` |
| **Administrator** | `http://localhost:5173/admin` | `admin@sahayak.gov.in` | `Admin@123` |

---

## 6. Troubleshooting & Ports

- **Port 8000 already in use?**
  Run: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force` in PowerShell.
- **Frontend can't reach backend?**
  Ensure backend is running on `http://localhost:8000`. If you run on port 8080, set `VITE_API_BASE_URL=http://localhost:8080` in `frontend/.env`.
- **Database Connection Issues?**
  Check `backend/.env`. MongoDB URI is pre-configured with MongoDB Atlas cluster credentials.
