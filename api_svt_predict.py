"""Flask REST API for SVT prediction.

Endpoints:
  GET  /health
  POST /predict       JSON clinical values
  POST /predict/csv   Uploaded clinical, MIT-BIH feature, or digitized timeseries CSV
  POST /convert-image Uploaded ECG image converted to CSV
  POST /predict/image Uploaded ECG image converted to CSV and predicted
"""

from __future__ import annotations

import csv
import os
import subprocess
import sys
import tempfile
from io import BytesIO, StringIO
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from svt_pipeline import (
    FEATURE_NAMES,
    build_clinical_feature_frame,
    drop_invalid_feature_rows,
    extract_features_from_any_csv,
    load_csv,
    summarize_feature_predictions,
)


app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).parent / "models" / "svt_minimal_model.joblib"
DIGITIZER_DIR = Path(__file__).parent / "Open-ECG-Digitizer-main"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}. Please train the model first.")

MODEL_BUNDLE = joblib.load(MODEL_PATH)
MODEL = MODEL_BUNDLE["model"]
THRESHOLD = float(MODEL_BUNDLE["threshold"])
MODEL_FEATURE_NAMES = MODEL_BUNDLE.get("feature_names", FEATURE_NAMES)


def clinical_messages(features: dict, label: str | None = None) -> list[str]:
    """Generate concise clinical notes from normalized feature values."""
    messages = []
    hr = float(features["heart_rate_bpm"])
    pr = float(features["pr_interval_s"])
    qrs = float(features["qrs_duration_s"])
    rr_regularity = str(features["rr_regularity"]).lower()
    p_wave_present = bool(features["p_wave_presence"])

    if hr > 100:
        messages.append("INFO: Tachycardia detected (HR > 100 bpm)")
    if pr < 0.12:
        messages.append("INFO: Short PR interval (<0.12 s)")
    if qrs < 0.12:
        messages.append("INFO: Narrow QRS complex (<0.12 s)")
    if hr >= 120 and qrs < 0.12 and not p_wave_present:
        messages.append("WARN: Pattern consistent with SVT (high HR, narrow QRS, no P-wave)")
    if hr >= 120 and rr_regularity == "irregular":
        messages.append("WARN: Irregular tachycardia pattern detected")
    if label == "SVT":
        messages.append("WARN: Model score is above the SVT decision threshold")
    return messages


def predict_feature_frame(features: pd.DataFrame, source_messages=None, metadata=None) -> dict:
    """Predict and format an API response from model-ready features."""
    if source_messages is None:
        source_messages = []
    if metadata is None:
        metadata = {}

    X = features[MODEL_FEATURE_NAMES].astype(float)
    probabilities = MODEL.predict_proba(X)[:, 1]
    probabilities = apply_clinical_svt_rules(features, probabilities)
    summary = summarize_feature_predictions(features, probabilities, THRESHOLD)
    label = summary["record_label"]
    mean_features = summary["mean_features"]

    messages = list(source_messages)
    messages.extend(clinical_messages(mean_features, label))

    return {
        "status": "success",
        "prediction": {
            "label": label,
            "svt_probability": summary["record_probability"],
            "decision_threshold": THRESHOLD,
            "messages": messages,
        },
        "input": {
            **mean_features,
            "source": metadata.get("source", "clinical"),
            "sample_count": summary["sample_count"],
        },
        "csv_analysis": {
            "source": metadata.get("source"),
            "sample_count": summary["sample_count"],
            "svt_count": summary["svt_count"],
            "svt_fraction": summary["svt_fraction"],
            "mean_probability": summary["mean_probability"],
            "max_probability": summary["max_probability"],
            "row_predictions": summary["row_predictions"],
            "metadata": metadata,
        },
    }


def apply_clinical_svt_rules(features: pd.DataFrame, probabilities: np.ndarray) -> np.ndarray:
    """Raise scores for obvious narrow-complex tachycardia SVT patterns."""
    adjusted = np.asarray(probabilities, dtype=float).copy()
    hr = features["heart_rate_bpm"].astype(float)
    qrs = features["qrs_duration_s"].astype(float)
    pr = features["pr_interval_s"].astype(float)
    p_wave = features["p_wave_presence"].astype(float)

    strong_pattern = (hr >= 150) & (qrs <= 0.12) & (p_wave < 0.5)
    short_pr_pattern = (hr >= 140) & (qrs <= 0.12) & (pr < 0.12)

    adjusted[strong_pattern.to_numpy()] = np.maximum(
        adjusted[strong_pattern.to_numpy()],
        max(THRESHOLD + 0.08, 0.55),
    )
    adjusted[short_pr_pattern.to_numpy()] = np.maximum(
        adjusted[short_pr_pattern.to_numpy()],
        max(THRESHOLD + 0.03, 0.48),
    )
    return adjusted


def parse_optional_float(value, default=None):
    if value in (None, ""):
        return default
    return float(value)


def get_uploaded_file(*names):
    for name in names:
        uploaded = request.files.get(name)
        if uploaded and uploaded.filename:
            return uploaded
    return None


@app.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "status": "ok",
            "service": "SVT Detection API",
            "version": "2.0",
            "model_loaded": MODEL_PATH.exists(),
            "endpoints": {
                "/predict": "POST JSON - predict SVT from clinical values",
                "/predict/csv": "POST multipart - predict SVT from uploaded CSV",
                "/convert-image": "POST multipart - convert ECG image to CSV",
                "/predict/image": "POST multipart - convert ECG image and predict SVT",
                "/health": "GET - service health check",
            },
        }
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "healthy",
            "model_loaded": MODEL_PATH.exists(),
            "feature_names": MODEL_FEATURE_NAMES,
            "threshold": THRESHOLD,
            "model_metadata": MODEL_BUNDLE.get("metadata", {}),
        }
    )


@app.route("/predict", methods=["POST"])
def predict():
    """Predict SVT from manual clinical JSON input."""
    try:
        if not request.is_json:
            return jsonify({"status": "error", "message": "Content-Type must be application/json"}), 400

        user_input = request.get_json()
        required = [
            "heart_rate_bpm",
            "pr_interval_s",
            "qrs_duration_s",
            "rr_regularity",
            "p_wave_presence",
        ]
        missing = [field for field in required if field not in user_input]
        if missing:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Missing required fields: {', '.join(missing)}",
                        "required_fields": required,
                    }
                ),
                400,
            )

        features = build_clinical_feature_frame(user_input)
        valid = drop_invalid_feature_rows(features)
        if valid.empty:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Clinical values are missing or outside accepted ECG ranges.",
                    }
                ),
                400,
            )

        result = predict_feature_frame(valid, metadata={"source": "clinical_json"})
        result["input"].update(user_input)
        result.pop("csv_analysis", None)
        return jsonify(result), 200

    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Internal server error: {exc}"}), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """Batch prediction endpoint for multiple clinical JSON samples."""
    try:
        if not request.is_json:
            return jsonify({"status": "error", "message": "Content-Type must be application/json"}), 400
        data = request.get_json()
        samples = data.get("samples")
        if not isinstance(samples, list):
            return jsonify({"status": "error", "message": "JSON body must contain a 'samples' array"}), 400

        results = []
        for index, sample in enumerate(samples):
            try:
                features = drop_invalid_feature_rows(build_clinical_feature_frame(sample))
                if features.empty:
                    raise ValueError("Invalid clinical values.")
                result = predict_feature_frame(features, metadata={"source": "clinical_json"})
                results.append({"sample_index": index, "status": "success", "prediction": result["prediction"]})
            except Exception as exc:
                results.append({"sample_index": index, "status": "error", "error": str(exc)})

        return jsonify({"status": "success", "total_samples": len(samples), "results": results}), 200

    except Exception as exc:
        return jsonify({"status": "error", "message": f"Internal server error: {exc}"}), 500


@app.route("/predict/csv", methods=["POST"])
def predict_csv():
    """Predict SVT from an uploaded CSV file."""
    try:
        uploaded = get_uploaded_file("csv", "file")
        if uploaded is None:
            return jsonify({"status": "error", "message": "Upload a CSV file in field 'csv' or 'file'."}), 400

        sample_rate_hz = parse_optional_float(request.form.get("sample_rate_hz"), default=None)
        df = load_csv(uploaded)
        extraction = extract_features_from_any_csv(df, sample_rate_hz=sample_rate_hz)
        metadata = {
            **extraction.metadata,
            "source": extraction.source,
            "filename": uploaded.filename,
        }
        result = predict_feature_frame(extraction.features, extraction.messages, metadata)
        return jsonify(result), 200

    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Internal server error: {exc}"}), 500


@app.route("/convert-image", methods=["POST"])
def convert_image():
    """Convert uploaded ECG image into a CSV timeseries file."""
    uploaded = get_uploaded_file("image", "file")
    if uploaded is None:
        return jsonify({"status": "error", "message": "Upload an ECG image in field 'image' or 'file'."}), 400

    try:
        image_bytes = uploaded.read()
        layout = request.form.get("layout", "Standard 3x4")
        method = request.form.get("method", "auto")
        sample_rate_hz = parse_optional_float(request.form.get("sample_rate_hz"), default=500.0)
        csv_bytes, csv_name, conversion_method, message = image_to_csv_bytes(
            image_bytes=image_bytes,
            filename=uploaded.filename,
            layout=layout,
            method=method,
            sample_rate_hz=sample_rate_hz,
        )
        response = send_file(
            BytesIO(csv_bytes),
            mimetype="text/csv",
            as_attachment=True,
            download_name=csv_name,
        )
        response.headers["X-Conversion-Method"] = conversion_method
        response.headers["X-Conversion-Message"] = message
        return response
    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Image conversion failed: {exc}"}), 500


@app.route("/predict/image", methods=["POST"])
def predict_image():
    """Convert an uploaded ECG image to CSV and predict SVT from the extracted signal."""
    uploaded = get_uploaded_file("image", "file")
    if uploaded is None:
        return jsonify({"status": "error", "message": "Upload an ECG image in field 'image' or 'file'."}), 400

    try:
        image_bytes = uploaded.read()
        layout = request.form.get("layout", "Standard 3x4")
        method = request.form.get("method", "auto")
        sample_rate_hz = parse_optional_float(request.form.get("sample_rate_hz"), default=500.0)
        csv_bytes, csv_name, conversion_method, message = image_to_csv_bytes(
            image_bytes=image_bytes,
            filename=uploaded.filename,
            layout=layout,
            method=method,
            sample_rate_hz=sample_rate_hz,
        )
        df = pd.read_csv(BytesIO(csv_bytes))
        extraction = extract_features_from_any_csv(df, sample_rate_hz=sample_rate_hz)
        metadata = {
            **extraction.metadata,
            "source": "image_to_csv",
            "filename": uploaded.filename,
            "converted_csv_filename": csv_name,
            "conversion_method": conversion_method,
            "conversion_message": message,
        }
        result = predict_feature_frame(extraction.features, extraction.messages, metadata)
        result["converted_csv"] = {
            "filename": csv_name,
            "method": conversion_method,
            "preview": df.head(10).to_dict(orient="records"),
        }
        return jsonify(result), 200

    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Image prediction failed: {exc}"}), 500


def image_to_csv_bytes(
    image_bytes: bytes,
    filename: str,
    layout: str,
    method: str,
    sample_rate_hz: float,
) -> tuple[bytes, str, str, str]:
    """Convert ECG image bytes to CSV using Open ECG Digitizer, with a lightweight fallback."""
    method = (method or "auto").lower()
    if method not in {"auto", "open-ecg", "simple"}:
        raise ValueError("method must be one of: auto, open-ecg, simple")

    if method in {"auto", "open-ecg"}:
        try:
            return run_open_ecg_digitizer(image_bytes, filename, layout)
        except Exception as exc:
            if method == "open-ecg":
                raise
            fallback_message = f"Open ECG Digitizer unavailable; used simple image trace fallback. Detail: {exc}"
            csv_bytes, csv_name = simple_image_trace_to_csv(image_bytes, filename, sample_rate_hz)
            return csv_bytes, csv_name, "simple", fallback_message

    csv_bytes, csv_name = simple_image_trace_to_csv(image_bytes, filename, sample_rate_hz)
    return csv_bytes, csv_name, "simple", "Used simple image trace fallback."


def run_open_ecg_digitizer(image_bytes: bytes, filename: str, layout: str) -> tuple[bytes, str, str, str]:
    """Run the bundled Open ECG Digitizer command-line pipeline."""
    if not DIGITIZER_DIR.exists():
        raise RuntimeError("Open-ECG-Digitizer-main folder was not found.")

    config_map = {
        "Standard 3x4": "src/config/inference_wrapper_george-moody-2024.yml",
        "Standard 6x2": "src/config/inference_wrapper_sixbytwo.yml",
    }
    selected_config = config_map.get(layout, config_map["Standard 3x4"])
    safe_name = secure_filename(filename or "ecg_image.png")
    suffix = Path(safe_name).suffix or ".png"

    with tempfile.TemporaryDirectory(prefix="svt_digitize_") as tmp_dir:
        input_dir = Path(tmp_dir) / "input"
        output_dir = Path(tmp_dir) / "output"
        input_dir.mkdir()
        output_dir.mkdir()
        image_path = input_dir / f"upload{suffix}"
        image_path.write_bytes(image_bytes)

        command = [
            sys.executable,
            "-m",
            "src.digitize",
            "--config",
            selected_config,
            f"DATA.images_path={input_dir}",
            f"DATA.output_path={output_dir}",
            "DATA.save_mode=timeseries_only",
        ]
        completed = subprocess.run(
            command,
            cwd=str(DIGITIZER_DIR),
            capture_output=True,
            text=True,
            timeout=240,
        )
        if completed.returncode != 0:
            details = completed.stderr.strip() or completed.stdout.strip()
            raise RuntimeError(details[-1200:] if details else "Digitizer command failed.")

        csv_files = list(output_dir.rglob("*_timeseries_canonical.csv"))
        if not csv_files:
            raise RuntimeError("Digitizer completed but did not produce a timeseries CSV.")

        csv_path = csv_files[0]
        return (
            csv_path.read_bytes(),
            csv_path.name,
            "open-ecg",
            "Converted with bundled Open ECG Digitizer.",
        )


def simple_image_trace_to_csv(image_bytes: bytes, filename: str, sample_rate_hz: float) -> tuple[bytes, str]:
    """Lightweight ECG image trace fallback that extracts one approximate lead."""
    try:
        import cv2
    except Exception as exc:
        raise RuntimeError(f"OpenCV is required for simple image conversion: {exc}") from exc

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image file. Upload a valid PNG or JPG ECG image.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    dark_threshold = min(120, float(np.percentile(gray, 18)))
    mask = gray <= dark_threshold

    height, width = mask.shape
    if width < 50 or height < 50:
        raise ValueError("Image is too small for ECG trace extraction.")

    y_values = np.full(width, np.nan, dtype=float)
    for x in range(width):
        ys = np.where(mask[:, x])[0]
        if ys.size:
            middle_band = ys[(ys > height * 0.08) & (ys < height * 0.92)]
            if middle_band.size:
                y_values[x] = float(np.median(middle_band))

    good = np.isfinite(y_values)
    if good.sum() < width * 0.20:
        raise ValueError("Could not extract enough ECG trace pixels from the image.")

    x_axis = np.arange(width)
    y_values = np.interp(x_axis, x_axis[good], y_values[good])
    y_values = pd.Series(y_values).rolling(window=5, center=True, min_periods=1).median().to_numpy()
    signal = -(y_values - np.nanmedian(y_values))
    scale = np.nanpercentile(np.abs(signal), 95) or 1.0
    signal = signal / scale
    time_s = x_axis / float(sample_rate_hz)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["time_s", "II"])
    writer.writerows(zip([f"{value:.6f}" for value in time_s], [f"{value:.6f}" for value in signal]))

    stem = Path(secure_filename(filename or "ecg_image")).stem or "ecg_image"
    return output.getvalue().encode("utf-8"), f"{stem}_simple_timeseries.csv"


if __name__ == "__main__":
    print("=" * 70)
    print("SVT Detection API Server")
    print("=" * 70)
    print(f"Model: {MODEL_PATH}")
    print(f"Threshold: {THRESHOLD:.3f}")
    print("\nStarting Flask server on http://localhost:8002")
    print("\nEndpoints:")
    print("  GET  /health")
    print("  POST /predict")
    print("  POST /predict/batch")
    print("  POST /predict/csv")
    print("  POST /convert-image")
    print("  POST /predict/image")
    print("\nPress Ctrl+C to stop")
    print("=" * 70)

    app.run(host="0.0.0.0", port=8002, debug=True)
