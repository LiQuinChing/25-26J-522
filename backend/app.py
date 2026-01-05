import io
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import tensorflow as tf

MODEL_PATH = Path(__file__).with_name("svt_model.keras")
model: tf.keras.Model | None = None
model_load_error: str | None = None

app = FastAPI()

# Allow React to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_SIZE = 224
CLASSES = ["Normal", "SVT"]

def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((IMG_SIZE, IMG_SIZE))
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image


@app.on_event("startup")
async def _load_model() -> None:
    global model, model_load_error
    # Load once on startup so import errors don't crash reload loops.
    # compile=False avoids requiring custom losses/metrics for inference.
    try:
        model = tf.keras.models.load_model(str(MODEL_PATH), compile=False)
        model_load_error = None
    except Exception as exc:
        model = None
        model_load_error = f"{type(exc).__name__}: {exc}"


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "model_error": model_load_error,
    }

@app.post("/predict")
async def predict_ecg(file: UploadFile = File(...)):
    if model is None:
        return {
            "error": "Model is not loaded.",
            "details": model_load_error,
        }

    image_bytes = await file.read()
    image = preprocess_image(image_bytes)

    prediction = model.predict(image)
    p_svt = float(prediction[0][0])
    is_svt = p_svt > 0.5
    class_id = 1 if is_svt else 0
    confidence = p_svt if is_svt else (1.0 - p_svt)

    return {"prediction": CLASSES[class_id], "confidence": confidence}
