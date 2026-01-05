# How to Test ECG Model with Postman - Step by Step

## Prerequisites
1. ✅ Model already trained (`ptbdb.h5` file exists)
2. ✅ Flask installed

## Step 1: Install Flask
```bash
pip install flask
```

## Step 2: Start the API Server
```bash
python api_server.py
```

You should see:
```
==================================================
ECG Myocardial Infarction Detection API
==================================================
Server starting on http://localhost:5000
Use Postman to test the API endpoints
==================================================
```

## Step 3: Open Postman

## Step 4: Test API Health Check

### Request 1: Check if API is Running
- **Method**: `GET`
- **URL**: `http://localhost:5000/`
- Click **Send**

**Expected Response:**
```json
{
    "message": "ECG Myocardial Infarction Detection API",
    "status": "running",
    "endpoints": {
        "/predict": "POST - Send ECG data for prediction",
        "/health": "GET - Check API health"
    }
}
```

### Request 2: Check Health
- **Method**: `GET`
- **URL**: `http://localhost:5000/health`
- Click **Send**

**Expected Response:**
```json
{
    "status": "healthy",
    "model_loaded": true
}
```

## Step 5: Make a Prediction (Single Sample)

### Request: Predict ECG
- **Method**: `POST`
- **URL**: `http://localhost:5000/predict`
- **Headers**: 
  - Key: `Content-Type`
  - Value: `application/json`
- **Body**: Select `raw` and `JSON`, then paste:

```json
{
  "ecg_data": [
    -0.14, -0.13, -0.12, -0.11, -0.10, -0.09, -0.08, -0.07, -0.06, -0.05,
    -0.04, -0.03, -0.02, -0.01, 0.00, 0.01, 0.02, 0.03, 0.04, 0.05,
    0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15,
    0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22, 0.23, 0.24, 0.25,
    0.26, 0.27, 0.28, 0.29, 0.30, 0.31, 0.32, 0.33, 0.34, 0.35,
    0.36, 0.37, 0.38, 0.39, 0.40, 0.41, 0.42, 0.43, 0.44, 0.45,
    0.46, 0.47, 0.48, 0.49, 0.50, 0.51, 0.52, 0.53, 0.54, 0.55,
    0.56, 0.57, 0.58, 0.59, 0.60, 0.61, 0.62, 0.63, 0.64, 0.65,
    0.66, 0.67, 0.68, 0.69, 0.70, 0.71, 0.72, 0.73, 0.74, 0.75,
    0.76, 0.77, 0.78, 0.79, 0.80, 0.81, 0.82, 0.83, 0.84, 0.85,
    0.86, 0.87, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95,
    0.96, 0.97, 0.98, 0.99, 1.00, 0.99, 0.98, 0.97, 0.96, 0.95,
    0.94, 0.93, 0.92, 0.91, 0.90, 0.89, 0.88, 0.87, 0.86, 0.85,
    0.84, 0.83, 0.82, 0.81, 0.80, 0.79, 0.78, 0.77, 0.76, 0.75,
    0.74, 0.73, 0.72, 0.71, 0.70, 0.69, 0.68, 0.67, 0.66, 0.65,
    0.64, 0.63, 0.62, 0.61, 0.60, 0.59, 0.58, 0.57, 0.56, 0.55,
    0.54, 0.53, 0.52, 0.51, 0.50, 0.49, 0.48, 0.47, 0.46, 0.45,
    0.44, 0.43, 0.42, 0.41, 0.40, 0.39, 0.38, 0.37, 0.36, 0.35,
    0.34, 0.33, 0.32, 0.31, 0.30, 0.29, 0.28
  ]
}
```

- Click **Send**

**Expected Response:**
```json
{
    "prediction": 0,
    "confidence": 0.23456,
    "result": "Normal",
    "message": "0 = Normal ECG, 1 = Abnormal ECG (Myocardial Infarction)"
}
```

## Step 6: Test with Real Data from CSV

To test with actual ECG data from your dataset, run this Python script to extract a sample:

```python
import pandas as pd
import json

# Load a normal sample
normal_data = pd.read_csv("ptbdb_normal.csv", header=None)
sample = normal_data.iloc[0, :187].tolist()

print(json.dumps({"ecg_data": sample}, indent=2))
```

Copy the output and use it in Postman's body.

## Step 7: Batch Predictions (Optional)

- **Method**: `POST`
- **URL**: `http://localhost:5000/predict_batch`
- **Body**: 

```json
{
  "ecg_data": [
    [/* 187 values for sample 1 */],
    [/* 187 values for sample 2 */],
    [/* 187 values for sample 3 */]
  ]
}
```

## Summary of Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Check API health |
| `/predict` | POST | Single ECG prediction |
| `/predict_batch` | POST | Multiple ECG predictions |

## Troubleshooting

**Error: "Model not loaded"**
- Make sure `ptbdb.h5` exists in the same directory
- Run `python main.py` first to train the model

**Error: "Connection refused"**
- Make sure the API server is running
- Check if port 5000 is not being used by another application

**Error: "ecg_data must have exactly 187 values"**
- Ensure your JSON array has exactly 187 numeric values

## Notes
- Each ECG sample must have exactly **187 values**
- Prediction: `0` = Normal ECG, `1` = Abnormal (Myocardial Infarction)
- Confidence value ranges from 0.0 to 1.0
