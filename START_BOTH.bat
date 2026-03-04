@echo off
echo ========================================
echo MI Detection System - Starting Both Servers
echo ========================================
echo.

REM Check if model exists
if not exist "models\best_model.h5" (
    echo [WARNING] Model not found at models\best_model.h5
    echo You need to train the model first!
    echo.
    echo Run: cd src ^&^& python train.py
    echo.
    choice /C YN /M "Do you want to continue anyway (backend will show warning)"
    if errorlevel 2 exit /b
    echo.
)

echo [INFO] Starting servers...
echo   - Flask API will run on: http://localhost:5000
echo   - React Frontend will run on: http://localhost:3000
echo.

echo [1/2] Starting Flask API Server...
start "MI Detection - Flask API" cmd /k "echo Starting Flask API... && python app.py"
timeout /t 3 /nobreak > nul

echo [2/2] Starting React Frontend...
cd frontend
start "MI Detection - React Frontend" cmd /k "echo Starting React Frontend... && npm start"
cd ..

echo.
echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Two new windows have been opened:
echo   1. Flask API Server - http://localhost:5000
echo   2. React Frontend - http://localhost:3000
echo.
echo [NEXT STEPS]
echo 1. Wait for both servers to fully start (1-2 minutes)
echo 2. Browser will open automatically at http://localhost:3000
echo 3. Upload an ECG image to test the system
echo.
echo [TO STOP SERVERS]
echo - Close both command windows that opened
echo - Or press Ctrl+C in each window
echo.
echo ========================================
echo.
pause
