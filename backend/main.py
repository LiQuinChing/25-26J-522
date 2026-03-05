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
from database import users_collection, ecg_scans_collection
from models import UserCreate, UserLogin, GoogleAuth, ForgotPasswordRequest, ResetPasswordRequest
from auth import hash_password, verify_password, create_access_token
from fastapi import HTTPException
import os
from auth import verify_token
from fastapi import Depends
import neurokit2 as nk
from pydantic import BaseModel
from fastapi import BackgroundTasks
import smtplib
import jwt
from datetime import datetime, timedelta, timezone
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from auth import SECRET_KEY, ALGORITHM
import random
from dotenv import load_dotenv
import cv2
from fastapi.responses import FileResponse
from fastapi import BackgroundTasks

load_dotenv()

# Email credentials from .env
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

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

# Endpoint to convert ECG image to digital format
@app.post("/convert-ecg-image")
async def convert_ecg_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):

    TEMP_DIR = "temp_ecg"
    os.makedirs(TEMP_DIR, exist_ok=True)

    img_path = os.path.join(TEMP_DIR, file.filename)

    with open(img_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Read image
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

    img = cv2.GaussianBlur(img, (5,5), 0)
    _, thresh = cv2.threshold(img, 120, 255, cv2.THRESH_BINARY_INV)

    height, width = thresh.shape
    signal = []

    for x in range(width):
        column = thresh[:, x]
        y_points = np.where(column > 0)[0]

        if len(y_points) > 0:
            y = np.mean(y_points)
        else:
            y = height / 2

        signal.append(height - y)

    signal = np.array(signal)

    signal = (signal - np.mean(signal)) / np.std(signal)

    if len(signal) < 2000:
        repeats = int(np.ceil(2000 / len(signal)))
        signal = np.tile(signal, repeats)

    signal = signal[:2000]

    fs = 500
    record_name = "ecg_record"

    wfdb.wrsamp(
        record_name=record_name,
        fs=fs,
        units=["mV"],
        sig_name=["LeadII"],
        p_signal=signal.reshape(-1,1),
        write_dir=TEMP_DIR
    )

    zip_path = os.path.join(TEMP_DIR, "Digitalized_ECG.zip")

    with zipfile.ZipFile(zip_path, "w") as zipf:
        zipf.write(os.path.join(TEMP_DIR, "ecg_record.dat"), "ecg_record.dat")
        zipf.write(os.path.join(TEMP_DIR, "ecg_record.hea"), "ecg_record.hea")

    # delete folder AFTER response
    background_tasks.add_task(shutil.rmtree, TEMP_DIR)

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename="Digitalized_ECG.zip",
        background=background_tasks
    )

@app.post("/analyze_ecg/")
async def analyze_ecg(file: UploadFile = File(...), current_user: str = Depends(verify_token)):
    # Save uploaded file to temp
    UPLOAD_DIR = "uploaded_ecg"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    try:
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

        # Extract Lead II for analysis
        if signal.shape[1] >= 2:
            lead2 = signal[:,1]
        else:
            lead2 = signal[:,0]

        # Clean ECG signal
        ecg_clean = nk.ecg_clean(lead2, sampling_rate=fs)

        # Detect ECG waves
        # signals, info = nk.ecg_process(ecg_clean, sampling_rate=fs)

        try:
            signals, info = nk.ecg_process(ecg_clean, sampling_rate=fs)
        except Exception:
            # fallback if signal too short
            signals = {"ECG_Rate": [0]}
            intervals = {}

        # Compute intervals
        intervals = nk.ecg_intervalrelated(signals, sampling_rate=fs)

        # Heart Rate
        heart_rate = float(np.nanmean(signals["ECG_Rate"]))

        # PR interval
        if "ECG_PR_Interval" in intervals.columns:
            pr_interval = float(np.nanmean(intervals["ECG_PR_Interval"]))
        else:
            pr_interval = 0

        # QRS duration
        if "ECG_QRS_Duration" in intervals.columns:
            qrs_duration = float(np.nanmean(intervals["ECG_QRS_Duration"]))
        else:
            qrs_duration = 0

        # QTc interval
        if "ECG_QTc" in intervals.columns:
            qtc_interval = float(np.nanmean(intervals["ECG_QTc"]))
        else:
            qtc_interval = 0

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

        # Extract Lead II for waveform display
        if signal.shape[1] >= 2:
            lead2 = signal[:,1]
        else:
            lead2 = signal[:,0]

        # Reduce length for frontend rendering
        lead2 = lead2[:5000]   # first 5000 samples

        # Generate unique 4-digit scan ID
        while True:
            scan_id = str(random.randint(1000, 9999))
            existing_scan = await ecg_scans_collection.find_one({"scan_id": scan_id})
            if not existing_scan:
                break

        # get user information
        user = await users_collection.find_one({"email": current_user})

        user_name = user["full_name"] if user else "Unknown"

        # store analysis result
        await ecg_scans_collection.insert_one({
            "scan_id": scan_id,
            "user_full_name": user_name,
            "user_email": current_user,
            "cad_detected": cad_detected,
            "cad_score": round(result.get("cad_score",0)*100,2),
            "p95": round(result.get("p95",0),3),
            "ischemic_burden": round(result.get("ischemic_burden",0)*100,2),
            "max_consecutive_segments": result.get("max_consecutive_segments",0),
            "heart_rate": round(heart_rate,1),
            "pr_interval": round(pr_interval,1),
            "qrs_duration": round(qrs_duration,1),
            "qtc_interval": round(qtc_interval,1),
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {
            "scan_id": scan_id,
            "cad_detected": cad_detected,
            "cad_score": round(result.get("cad_score",0)*100,2),
            "p95": round(result.get("p95",0),3),
            "ischemic_burden": round(result.get("ischemic_burden",0)*100,2),
            "max_consecutive_segments": result.get("max_consecutive_segments",0),
            "plot_bytes": plot_bytes.hex(),  # send plot as hex string to frontend
            "ecg_signal": lead2.tolist(),
            "sampling_rate": fs,

            # ECG measurements
            "heart_rate": round(heart_rate,1),
            "pr_interval": round(pr_interval,1),
            "qrs_duration": round(qrs_duration,1),
            "qtc_interval": round(qtc_interval,1),
        }
    
    finally:
        # ALWAYS delete folder even if error happens
        if os.path.exists(UPLOAD_DIR):
            shutil.rmtree(UPLOAD_DIR)

# Sign up endpoint
@app.post("/signup")
async def signup(user: UserCreate):

    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)

    await users_collection.insert_one({
        "full_name": user.full_name,
        "email": user.email,
        "password": hashed_pw,
        "auth_type": "local"
    })

    token = create_access_token({"email": user.email})

    return {"message": "User created successfully", "access_token": token, "users": {
        "full_name": user.full_name,
        "email": user.email
    }}

@app.post("/login")
async def login(user: UserLogin):

    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials! Please try again.")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials! Please try again.")

    token = create_access_token({"email": user.email})

    return {"access_token": token, "users": {
        "full_name": db_user["full_name"],
        "email": db_user["email"]
    }}

@app.post("/google-signup")
async def google_signup(data: GoogleAuth):

    from google.oauth2 import id_token
    from google.auth.transport import requests

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")
        )

        email = idinfo["email"]
        name = idinfo.get("name", "")

        existing_user = await users_collection.find_one({"email": email})

        if not existing_user:
            await users_collection.insert_one({
                "full_name": name,
                "email": email,
                "password": None,
                "auth_type": "google"
            })

        token = create_access_token({"email": email})

        return {"access_token": token,"users": {
            "full_name": name,
            "email": email
        }}

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    
# Email sending function
def send_reset_email(to_email, reset_link):

    subject = "QCardio Password Reset"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background:#f5f7fa; padding:30px;">
    
        <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;
        box-shadow:0 5px 20px rgba(0,0,0,0.1);">

            <h2 style="color:#0f766e;">QCardio</h2>

            <p>Hello,</p>

            <p>You requested a password reset for your <b>QCardio</b> account.</p>

            <p>Click the button below to reset your password:</p>

            <div style="text-align:center;margin:30px 0;">
                <a href="{reset_link}"
                style="
                    background:#0f766e;
                    color:white;
                    padding:12px 24px;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                    display:inline-block;
                ">
                Reset Password
                </a>
            </div>

            <p style="font-size:13px;color:#666;">
            If you did not request this, please ignore this email.
            </p>

            <hr>

            <p style="font-size:12px;color:#999;">
            QCardio Security Team
            </p>

        </div>

    </body>
    </html>
    """

    msg = MIMEText(html_body, "html")
    msg["Subject"] = subject
    msg["From"] = formataddr(("QCardio", EMAIL_ADDRESS))
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)

# Forgot password endpoint
@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):

    user = await users_collection.find_one({"email": data.email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_access_token(
        {"email": data.email}
    )

    reset_link = f"http://localhost:3000/reset-password/{token}"

    send_reset_email(data.email, reset_link)

    return {"message": "Reset link generated"}

# Reset password endpoint
@app.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):

    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")

        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset link expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    hashed_pw = hash_password(data.password)

    await users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_pw}}
    )

    return {"message": "Password updated successfully"}

# Endpoint to get recent analyses for logged in user
@app.get("/recent-analysis")
async def get_recent_analysis(current_user: str = Depends(verify_token)):

    scans = []

    # cursor = ecg_scans_collection.find(
    #     {"user_email": current_user}
    # ).sort("created_at", -1).limit(5)

    cursor = ecg_scans_collection.find().sort("created_at", -1)

    async for scan in cursor:
        scans.append({
            "scan_id": scan["scan_id"],
            "user_name": scan.get("user_full_name", "Unknown"),
            "cad_detected": scan["cad_detected"],
            "created_at": scan["created_at"],
        })

    return scans