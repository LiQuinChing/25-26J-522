"""
FastAPI application for ECG Arrhythmia Classification (Binary CNN-LSTM)
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models import ECGSignal, PredictionResponse, HealthResponse
# Note: 'scaler' has been removed from this import!
from inference import load_model, predict_ecg, is_model_loaded
import logging
import pandas as pd
import numpy as np
import io
import random
from pathlib import Path
import os

DATA_PATH = Path(os.getenv('DATA_PATH', './data'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ECG Arrhythmia Classifier",
    description="API for binary heart rhythm classification from ECG signals (NSR vs Arrhythmia)",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== STARTUP ==================

@app.on_event("startup")
async def startup_event():
    """Load model when app starts"""
    logger.info("🚀 Starting up ECG Classifier API...")
    logger.info("Loading Keras model...") # <-- Updated text here
    success = load_model()
    if success:
        logger.info("✅ API ready for predictions")
    else:
        logger.error("❌ Failed to load model - check paths")

# ================== HEALTH CHECK ==================

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API health status"""
    return {
        "status": "healthy",
        "model_loaded": is_model_loaded()
    }

@app.get("/", tags=["Info"])
async def root():
    """API information and status"""
    return {
        "message": "ECG Arrhythmia Classifier API",
        "version": "2.0.0",
        "docs": "http://localhost:8000/docs",
        "model_loaded": is_model_loaded(),
        "note": "Signals are mathematically normalized before prediction."
    }

# ================== SINGLE PREDICTION ==================

@app.post("/predict", response_model=PredictionResponse, tags=["Predictions"])
async def predict(ecg_data: ECGSignal):
    """
    Classify single ECG signal
    - Signal will be automatically padded/truncated to 500 samples in inference.py
    """
    try:
        if not is_model_loaded():
            raise HTTPException(status_code=503, detail="Model not loaded. Please try again later.")

        if len(ecg_data.signal) == 0:
            raise HTTPException(status_code=400, detail="Signal cannot be empty")

        result = predict_ecg(ecg_data.signal)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        logger.info(f"✅ Prediction: {result['predicted_class']} (confidence: {result['confidence']:.2%})")
        return result

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"❌ Runtime error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ================== FILE UPLOAD - CSV ==================

@app.post("/upload-csv", tags=["File Upload"])
async def upload_csv_file(file: UploadFile = File(...)):
    """
    Upload and classify ECG signal from CSV file
    - Drops NaN values and processes full extracted signal
    """
    try:
        if not is_model_loaded():
            raise HTTPException(status_code=503, detail="Model not loaded")

        contents = await file.read()
        
        try:
            # 1. Try reading assuming text headers
            df = pd.read_csv(io.BytesIO(contents))
            
            # Check for multi-column raw format
            if any(col in df.columns for col in ['MLII', 'II', 'V5', 'time_ms', 'Unnamed: 0', 'I']):
                logger.info("Detected multi-column raw format")
                
                target_col = next((col for col in ['MLII', 'II', 'V1', 'V5', 'I'] if col in df.columns), None)
                if not target_col:
                    ignore_cols = ['time_ms', 'time', 'Unnamed: 0']
                    target_col = next(col for col in df.columns if col not in ignore_cols)
                
                # Extract all data and drop NaNs (Do not slice to 187 anymore)
                signal_values = df[target_col].dropna().values.astype(np.float32)
            else:
                # 2. Kaggle single-row format fallback
                logger.info("Detected single-row format")
                df = pd.read_csv(io.BytesIO(contents), header=None)
                signal_values = df.iloc[0].values.astype(np.float32)

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {e}")

        # Remove remaining NaNs just in case
        signal_values = signal_values[~np.isnan(signal_values)]

        if len(signal_values) == 0:
            raise HTTPException(status_code=400, detail="No valid signal data found")

        print(f"-----------> DEBUG: CSV Upload - Valid signal length extracted: {len(signal_values)}")

        # Clean trailing zeros for the frontend plot 
        signal_for_plot = signal_values.copy()
        trailing_zeros = 0
        for i in range(len(signal_for_plot) - 1, -1, -1):
            if signal_for_plot[i] == 0:
                trailing_zeros += 1
            else:
                break
        if trailing_zeros > 50:
            signal_for_plot = signal_for_plot[:-trailing_zeros]

        # Make the Prediction
        result = predict_ecg(signal_values.tolist())

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        result['signal_raw'] = signal_for_plot.tolist()
        
        # Perform mathematical normalization locally for frontend visual plotting
        sig_min = signal_values.min()
        sig_max = signal_values.max()
        normalized_signal = (signal_values - sig_min) / (sig_max - sig_min + 1e-8)
        result['signal_normalized'] = normalized_signal.tolist()

        logger.info(f"✅ Prediction: {result['predicted_class']} ({result['confidence']:.2%})")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing CSV: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

# ================== TEST DATA SAMPLES ==================

@app.get("/test-samples", tags=["Test Data"])
async def get_test_samples(count: int = 5):
    """
    Get random samples from test dataset
    - Adjusted for Binary Classification
    """
    try:
        if not is_model_loaded():
            raise HTTPException(status_code=503, detail="Model not loaded")

        X_test_path = DATA_PATH / 'X_test.npy'
        y_test_path = DATA_PATH / 'y_test.npy'

        if not X_test_path.exists() or not y_test_path.exists():
            raise FileNotFoundError("Test data files not found in ./data/")

        X_test = np.load(X_test_path)
        y_test = np.load(y_test_path)

        max_count = min(count, len(X_test))
        indices = random.sample(range(len(X_test)), max_count)

        samples = []
        
        for idx in indices:
            signal_raw = X_test[idx].flatten()
            label_val = int(y_test[idx])
            
            # Map old 5-class labels to binary (0 is NSR, anything else is Arrhythmia)
            true_label = 'NSR' if label_val == 0 else 'Arrhythmia'

            result = predict_ecg(signal_raw.tolist())
            result['signal_raw'] = signal_raw.tolist()

            # Normalize for plot
            sig_min = signal_raw.min()
            sig_max = signal_raw.max()
            signal_normalized = (signal_raw - sig_min) / (sig_max - sig_min + 1e-8)
            result['signal_normalized'] = signal_normalized.tolist()

            result['true_label'] = true_label
            result['true_label_id'] = 0 if label_val == 0 else 1
            result['index'] = int(idx)
            result['is_correct'] = result['predicted_class'] == true_label

            samples.append(result)

        logger.info(f"✅ Generated {len(samples)} test samples with signals")
        return {"samples": samples, "count": len(samples)}

    except FileNotFoundError as e:
        logger.error(f"❌ File not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Test samples error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ================== EXCEPTION HANDLER ==================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"❌ Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# ================== RUN ==================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True, log_level="info")