"""Flask REST API for SVT prediction.

Run this server:
  python api_svt_predict.py

Test with Postman:
  Method: POST
  URL: http://localhost:5000/predict
  Headers: Content-Type: application/json
  Body (JSON):
    {
      "heart_rate_bpm": 160,
      "pr_interval_s": 0.12,
      "qrs_duration_s": 0.09,
      "rr_regularity": "regular",
      "p_wave_presence": false
    }

Response example:
  {
    "status": "success",
    "prediction": {
      "label": "SVT",
      "svt_probability": 0.85,
      "decision_threshold": 0.748,
      "messages": [
        "WARN: tachycardia (HR > 100 bpm)",
        "INFO: pattern consistent with narrow-complex tachycardia (possible SVT)"
      ]
    },
    "input": { ... }
  }

Install requirements:
  pip install flask flask-cors
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for web browser testing

# Model path - using minimal model with 5 user inputs
MODEL_PATH = Path(__file__).parent / "models" / "svt_minimal_model.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}\n"
        "Please train the model first"
    )

# Load model at startup
MODEL_BUNDLE = joblib.load(MODEL_PATH)
MODEL = MODEL_BUNDLE['model']
THRESHOLD = MODEL_BUNDLE['threshold']
FEATURE_NAMES = MODEL_BUNDLE['feature_names']
# Features: ['heart_rate_bpm', 'pr_interval_s', 'qrs_duration_s', 'rr_regularity', 'p_wave_presence']


def predict_with_minimal_model(user_input):
    """Make prediction using the minimal 5-feature model."""
    messages = []
    
    # Extract inputs
    hr = float(user_input['heart_rate_bpm'])
    pr = float(user_input['pr_interval_s'])
    qrs = float(user_input['qrs_duration_s'])
    rr_reg = user_input['rr_regularity'].lower()
    p_wave = bool(user_input['p_wave_presence'])
    
    # Validation and messages
    if hr > 100:
        messages.append("INFO: Tachycardia detected (HR > 100 bpm)")
    if pr < 0.12:
        messages.append("INFO: Short PR interval (<0.12 s)")
    if qrs < 0.12:
        messages.append("INFO: Narrow QRS complex (<0.12 s)")
    if hr >= 120 and qrs < 0.12 and not p_wave:
        messages.append("WARN: Pattern consistent with SVT (high HR, narrow QRS, no P-wave)")
    if hr >= 120 and rr_reg == 'irregular':
        messages.append("WARN: Irregular tachycardia pattern detected")
    
    # Create feature array matching training format
    # Features: heart_rate_bpm, pr_interval_s, qrs_duration_s, rr_regularity, p_wave_presence
    rr_reg_numeric = 1.0 if rr_reg == 'irregular' else 0.0  # 1=irregular
    p_wave_numeric = 1.0 if p_wave else 0.0  # 1=present
    
    X = np.array([[hr, pr, qrs, rr_reg_numeric, p_wave_numeric]])
    proba = float(MODEL.predict_proba(X)[0, 1])
    pred = 1 if proba >= THRESHOLD else 0
    label = 'SVT' if pred == 1 else 'Healthy'
    
    return {
        'label': label,
        'svt_proba': proba,
        'threshold': THRESHOLD,
        'messages': messages
    }



@app.route("/", methods=["GET"])
def home():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "SVT Detection API",
        "version": "1.0",
        "endpoints": {
            "/predict": "POST - Predict SVT from ECG parameters",
            "/health": "GET - Service health check",
        }
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check."""
    return jsonify({"status": "healthy", "model_loaded": MODEL_PATH.exists()})


@app.route("/predict", methods=["POST"])
def predict():
    """Predict SVT from user-friendly ECG parameters.
    
    Required JSON body fields:
      - heart_rate_bpm (number): Heart rate in beats per minute
      - pr_interval_s (number): PR interval in seconds
      - qrs_duration_s (number): QRS duration in seconds
      - rr_regularity (string): "regular" or "irregular"
      - p_wave_presence (boolean): true if P-wave is present
    
    Optional fields (for advanced users):
      - Any feature column from the training dataset (e.g., 0_pre-RR, 0_rPeak, etc.)
    
    Returns JSON with prediction result.
    """
    
    try:
        # Parse JSON body
        if not request.is_json:
            return jsonify({
                "status": "error",
                "message": "Content-Type must be application/json"
            }), 400
        
        user_input = request.get_json()
        
        # Validate required fields
        required_fields = [
            "heart_rate_bpm",
            "pr_interval_s",
            "qrs_duration_s",
            "rr_regularity",
            "p_wave_presence"
        ]
        
        missing = [f for f in required_fields if f not in user_input]
        if missing:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing)}",
                "required_fields": required_fields
            }), 400
        
        # Validate input ranges
        hr = user_input.get('heart_rate_bpm')
        pr = user_input.get('pr_interval_s')
        qrs = user_input.get('qrs_duration_s')
        
        if hr < 30 or hr > 240:
            return jsonify({
                "status": "error",
                "message": "heart_rate_bpm must be between 30 and 240"
            }), 400
        
        if pr < 0.06 or pr > 0.35:
            return jsonify({
                "status": "error",
                "message": "pr_interval_s must be between 0.06 and 0.35"
            }), 400
        
        if qrs < 0.04 or qrs > 0.25:
            return jsonify({
                "status": "error",
                "message": "qrs_duration_s must be between 0.04 and 0.25"
            }), 400
        
        # Make prediction
        result = predict_with_minimal_model(user_input)
        
        # Success response
        return jsonify({
            "status": "success",
            "prediction": {
                "label": result["label"],
                "svt_probability": result["svt_proba"],
                "decision_threshold": result["threshold"],
                "messages": result["messages"]
            },
            "input": user_input
        }), 200
    
    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """Batch prediction endpoint.
    
    JSON body should contain "samples" array with multiple patient inputs.
    
    Example:
    {
      "samples": [
        {
          "heart_rate_bpm": 160,
          "pr_interval_s": 0.12,
          "qrs_duration_s": 0.09,
          "rr_regularity": "regular",
          "p_wave_presence": false
        },
        {
          "heart_rate_bpm": 75,
          "pr_interval_s": 0.16,
          "qrs_duration_s": 0.08,
          "rr_regularity": "regular",
          "p_wave_presence": true
        }
      ]
    }
    """
    
    try:
        if not request.is_json:
            return jsonify({
                "status": "error",
                "message": "Content-Type must be application/json"
            }), 400
        
        data = request.get_json()
        
        if "samples" not in data or not isinstance(data["samples"], list):
            return jsonify({
                "status": "error",
                "message": "JSON body must contain 'samples' array"
            }), 400
        
        results = []
        for i, sample in enumerate(data["samples"]):
            try:
                result = predict_with_minimal_model(sample)
                results.append({
                    "sample_index": i,
                    "status": "success",
                    "prediction": {
                        "label": result["label"],
                        "svt_probability": result["svt_proba"],
                        "decision_threshold": result["threshold"],
                        "messages": result["messages"]
                    }
                })
            except Exception as e:
                results.append({
                    "sample_index": i,
                    "status": "error",
                    "error": str(e)
                })
        
        return jsonify({
            "status": "success",
            "total_samples": len(data["samples"]),
            "results": results
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500


if __name__ == "__main__":
    print("=" * 70)
    print("SVT Detection API Server")
    print("=" * 70)
    print(f"Model: {MODEL_PATH}")
    print("\nStarting Flask server on http://localhost:8000")
    print("\nEndpoints:")
    print("  GET  http://localhost:8000/         - Service info")
    print("  GET  http://localhost:8000/health   - Health check")
    print("  POST http://localhost:8000/predict  - Single prediction")
    print("  POST http://localhost:8000/predict/batch - Batch prediction")
    print("\nPostman test example:")
    print("  Method: POST")
    print("  URL: http://localhost:8000/predict")
    print("  Headers: Content-Type: application/json")
    print('  Body: {"heart_rate_bpm":160,"pr_interval_s":0.12,"qrs_duration_s":0.09,"rr_regularity":"regular","p_wave_presence":false}')
    print("\nPress Ctrl+C to stop")
    print("=" * 70)
    
    # Run Flask app
    app.run(host="0.0.0.0", port=8000, debug=True)
