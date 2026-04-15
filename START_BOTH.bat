@echo off
cls
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║     ECG System - Starting All Services               ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo This will start all three services:
echo.
echo [1] Flask ML Model API (Python)
echo     - Handles: ECG Image Analysis / Predictions
echo     - Port: 5000
echo.
echo [2] Node.js Backend API (Express)
echo     - Handles: Results Storage / Patient History
echo     - Database: MongoDB Cloud (MongoDB Atlas)
echo     - Port: 3001
echo.
echo [3] React Frontend
echo     - Port: 3000
echo.
pause
echo.
echo Starting services...
echo.

REM Check if model exists
if not exist "models\best_model.h5" (
    echo [WARNING] Model not found at models\best_model.h5
    echo You need to train the model first!
    echo.
    echo Run: python src\train.py
    echo.
    choice /C YN /M "Do you want to continue anyway (ML API will show warning)"
    if errorlevel 2 exit /b
    echo.
)

REM Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Starting all services...
echo.

echo [1/3] Starting Flask ML Model API (port 5000)...
start "ECG - Flask ML API" cmd /k "echo Starting Flask ML API on port 5000... && python app.py"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Node.js Backend API (port 3001)...
start "ECG - Node Backend API" cmd /k "cd /d %~dp0backend && echo Starting Node.js Backend on port 3001... && npm start"
timeout /t 3 /nobreak > nul

echo [3/3] Starting React Frontend (port 3000)...
cd frontend
start "ECG - React Frontend" cmd /k "echo Starting React Frontend on port 3000... && npm start"
cd ..

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║        All Services Started Successfully!             ║
echo ╠═══════════════════════════════════════════════════════╣
echo ║ Flask ML API:     http://localhost:5000               ║
echo ║ Node Backend API: http://localhost:3001               ║
echo ║ React Frontend:   http://localhost:3000               ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo Services:
echo ✓ Flask ML API - ECG image analysis and predictions
echo ✓ Node Backend - Results storage and patient history
echo ✓ React Frontend - User interface
echo.
echo Wait for all servers to fully start (1-2 minutes)
echo Browser will open automatically at http://localhost:3000
echo.
echo Health Checks:
echo   Flask ML:  http://localhost:5000/api/health
echo   Node API:  http://localhost:3001/health
echo.
pause
exit /b
