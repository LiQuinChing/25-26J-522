# main.py
import os
import torch
import numpy as np
import wfdb
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
from io import BytesIO
import zipfile
import matplotlib
matplotlib.use('Agg')  # for headless server
import matplotlib.pyplot as plt
from model_module import CNN_LSTM, predict_ecg_clinical, detect_cad_clinical  # import functions from Colab notebook

app = FastAPI(title="ECG CAD Detection API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change this to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model
MODEL_PATH = "ptbxl_checkpoint.pt"  # download from Colab
model = CNN_LSTM().to(device)
checkpoint = torch.load(MODEL_PATH, map_location=device)
model.load_state_dict(checkpoint["model"])
model.eval()


@app.post("/analyze_ecg/")
async def analyze_ecg(file: UploadFile = File(...)):
    # Save uploaded file to temp
    UPLOAD_DIR = "uploaded_ecg"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    temp_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # If ZIP, extract
    if temp_path.endswith(".zip"):
        with zipfile.ZipFile(temp_path, 'r') as zip_ref:
            zip_ref.extractall(UPLOAD_DIR)
        os.remove(temp_path)  # remove zip after extraction

    # Find .hea file
    hea_files = []
    for root, dirs, files_in_dir in os.walk(UPLOAD_DIR):
        for f in files_in_dir:
            if f.endswith(".hea"):
                hea_files.append(os.path.join(root, f))

    if len(hea_files) == 0:
        return {"error": "No .hea file found in uploaded data"}

    record_path = hea_files[0].replace(".hea", "")
    record = wfdb.rdrecord(record_path)
    signal = record.p_signal
    fs = record.fs

    # Run model prediction
    result = predict_ecg_clinical(signal, model=model, device=device, fs=fs)
    cad_detected = detect_cad_clinical(result)

    # Plot segment-level probabilities
    plt.figure(figsize=(10,3))
    plt.plot(result["segment_probs"], marker='o')
    plt.axhline(0.5, color='r', linestyle='--')
    plt.xlabel("Segment Index")
    plt.ylabel("Ischemia Probability")
    plt.title("Segment-Level Ischemia Probabilities")
    plt.grid(True)
    plot_path = os.path.join(UPLOAD_DIR, "plot.png")
    plt.savefig(plot_path)
    plt.close()

    # Read plot as bytes
    with open(plot_path, "rb") as f:
        plot_bytes = f.read()

    # Cleanup
    shutil.rmtree(UPLOAD_DIR)

    return {
        "cad_detected": cad_detected,
        "cad_score": round(result.get("cad_score",0)*100,2),
        "p95": round(result.get("p95",0),3),
        "ischemic_burden": round(result.get("ischemic_burden",0)*100,2),
        "max_consecutive_segments": result.get("max_consecutive_segments",0),
        "plot_bytes": plot_bytes.hex()  # send plot as hex string to frontend
    }

