import numpy as np
import pandas as pd
import tensorflow as tf
import os
import logging
from scipy import signal as scipy_signal

# Path Configuration
MODEL_PATH = os.getenv('MODEL_PATH', './models/arrhythmia_1d_cnn_recordwise_NEW.h5')

# Global variables
model = None
logger = logging.getLogger(__name__)

def load_model():
    """Loads the .h5 model from saved files."""
    global model
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        logger.info(f"✓ Model loaded from {MODEL_PATH}")
        return True
    except Exception as e:
        logger.error(f"✗ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return False

def is_model_loaded():
    """Checks if the model is loaded."""
    return model is not None

def predict_ecg(signal: list[float], uncertainty_threshold: float = 0.6):
    """
    Classifies the ECG signal using the Keras 1D CNN-LSTM model.
    """
    if model is None:
        logger.error("Attempted prediction with unloaded model.")
        return {"error": "Model not loaded"}

    try:
        # 1. Clean missing data (NaN handling)
        signal_series = pd.Series(signal).dropna()
        clean_signal = signal_series.values.astype(np.float32)

        # 2. Ensure exactly 500 data points (Padding/Truncating to match training)
        target_length = 500
        if len(clean_signal) < target_length:
            padded = np.zeros(target_length)
            padded[:len(clean_signal)] = clean_signal
            clean_signal = padded
        else:
            # If the user uploads a long CSV, grab the first 500 valid points
            clean_signal = clean_signal[:target_length]

        # 3. Normalization (Matches the (signal - min) / (max - min) from training)
        signal_min = clean_signal.min()
        signal_max = clean_signal.max()
        clean_signal = (clean_signal - signal_min) / (signal_max - signal_min + 1e-8)

        # 4. Prepare the tensor for 1D CNN: Shape must be (1, 500, 1)
        signal_tensor = clean_signal.reshape(1, target_length, 1)

        # 5. Prediction
        probabilities = model.predict(signal_tensor)[0]

        # 6. Formatting the output
        class_names = ['NSR', 'Arrhythmia'] 
        predicted_idx = int(np.argmax(probabilities))
        predicted_class = class_names[predicted_idx]
        confidence = float(probabilities[predicted_idx])
        is_uncertain = confidence < uncertainty_threshold

        return {
            "NSR": float(probabilities[0]),
            "Arrhythmia": float(probabilities[1]),
            "predicted_class": predicted_class,
            "confidence": confidence,
            "is_uncertain": is_uncertain,
            "threshold": uncertainty_threshold
        }

    except Exception as e:
        logger.error(f"ERROR in predict_ecg: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# Load the model when the script starts
load_model()