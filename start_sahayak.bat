@echo off
TITLE SAHAYAK - System Launcher
COLOR 0B

echo ===============================================================================
echo                SAHAYAK (सहायक) - SYSTEM LAUNCHER
echo ===============================================================================
echo.
echo  Starting Backend (FastAPI on port 8000) in a new window...
start "SAHAYAK Backend (FastAPI)" cmd /k "cd /d %~dp0backend\crud && python -m uvicorn main:app --reload --port 8000"

echo  Starting Frontend (Vite React on port 5173) in a new window...
start "SAHAYAK Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===============================================================================
echo  SERVICES ARE STARTING!
echo ===============================================================================
echo.
echo  Frontend Portal:    http://localhost:5173
echo  Backend REST API:   http://localhost:8000
echo  Interactive Docs:   http://localhost:8000/docs
echo.
echo -------------------------------------------------------------------------------
echo  HOW TO TEST ACROSS 3 TABS (CITIZEN, OFFICER, ADMIN) SIMULTANEOUSLY:
echo -------------------------------------------------------------------------------
echo.
echo  Because browsers share localStorage (JWT tokens) within the same window,
echo  open each role in an isolated window:
echo.
echo  [TAB 1] Normal Window:   http://localhost:5173/login
echo          Login as CITIZEN:  citizen@sahayak.gov.in  ^|  Citizen@123
echo.
echo  [TAB 2] Incognito Window: http://localhost:5173/login   (Ctrl + Shift + N)
echo          Login as OFFICER:  officer@sahayak.gov.in  ^|  Officer@123
echo.
echo  [TAB 3] Guest/2nd Browser: http://localhost:5173/login  (or Microsoft Edge)
echo          Login as ADMIN:    admin@sahayak.gov.in    ^|  Admin@123
echo.
echo ===============================================================================
pause
