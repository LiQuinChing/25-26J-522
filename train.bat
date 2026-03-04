@echo off
REM Quick Training Script for MI Detection
REM Optimized for memory efficiency

echo ========================================
echo MI Detection Model Training
echo ========================================
echo.

echo [INFO] Setting environment variables...
set TF_ENABLE_ONEDNN_OPTS=0
set PYTHONLEGACYWINDOWSSTDIO=1
set TF_CPP_MIN_LOG_LEVEL=2

echo [INFO] Current configuration:
echo   - Image size: 96x96
echo   - Batch size: 8
echo   - Balance ratio: 0.3
echo   - Epochs: 50
echo.

echo [INFO] Memory requirements:
echo   - Minimum: 4GB RAM
echo   - Recommended: 8GB RAM
echo.

echo [STEP 1/3] Checking dataset...
if not exist "..\DataSet" (
    echo [ERROR] DataSet folder not found!
    echo Please ensure DataSet folder exists in the project root.
    pause
    exit /b 1
)
echo [OK] Dataset found
echo.

echo [STEP 2/3] Starting model training...
echo This may take 20-40 minutes depending on your hardware.
echo You can monitor progress in real-time below.
echo.
echo Press Ctrl+C to stop training (not recommended)
echo.

python train.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Training completed successfully!
    echo ========================================
    echo.
    echo Model saved to: ..\models\best_model.h5
    echo Training curves: ..\outputs\training_curves.png
    echo Training log: ..\outputs\training_log.csv
    echo.
    echo [NEXT STEPS]
    echo 1. Review training curves in outputs folder
    echo 2. Run evaluation: python evaluate.py
    echo 3. Start web app: cd .. ^&^& start.bat
    echo.
) else (
    echo.
    echo ========================================
    echo Training failed!
    echo ========================================
    echo.
    echo Common issues:
    echo   - Insufficient memory: Reduce batch_size in config.yaml
    echo   - Dataset not found: Check DataSet folder location
    echo   - Missing dependencies: pip install -r requirements.txt
    echo.
)

pause
