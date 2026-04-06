import numpy as np
import pandas as pd
import tensorflow as tf
import os
import logging

# Path Configuration
MODEL_PATH = os.getenv('MODEL_PATH', './models/arrhythmia_wfdb_NEW.keras')

# Global variables
model = None
logger = logging.getLogger(__name__)

def load_model():
    """Loads the .keras model from saved files."""
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
    Classifies the ECG signal using a standard, single-window approach.
    """
    if model is None:
        logger.error("Attempted prediction with unloaded model.")
        return {"error": "Model not loaded"}

    try:
        # 1. Clean missing data (NaN handling)
        signal_series = pd.Series(signal).dropna()
        clean_signal = signal_series.values.astype(np.float32)

        target_length = 500 # Exactly 2 seconds of data
        half_window = target_length // 2

        # 2. THE FIX: PEAK-SNAPPING
        # Instead of a random center slice, find the most prominent heartbeat.
        # We use absolute deviation from the median to catch both upward and downward spikes.
        baseline = np.median(clean_signal)
        deviation = np.abs(clean_signal - baseline)
        center_idx = int(np.argmax(deviation))

        # 3. Safely extract the window around the peak using edge padding
        # Pad the entire signal first so we don't get errors if the peak is near the edge
        padded_signal = np.pad(clean_signal, (half_window, half_window), mode='edge')
        
        # Shift our center_idx forward to account for the padding we just added
        new_center = center_idx + half_window
        
        # Extract exactly 500 points with the heartbeat perfectly dead-center!
        window = padded_signal[new_center - half_window : new_center + half_window]

        # 4. Local Normalization (Matches Colab perfectly)
        w_min = window.min()
        w_max = window.max()
        window_norm = (window - w_min) / (w_max - w_min + 1e-8)

        # 5. Predict
        signal_tensor = window_norm.reshape(1, target_length, 1)
        probabilities = model.predict(signal_tensor, verbose=0)[0]
        
        nsr_prob = float(probabilities[0])
        arr_prob = float(probabilities[1])
        
        # 6. Format Output
        if arr_prob > nsr_prob:
            predicted_class = 'Arrhythmia'
            confidence = arr_prob
        else:
            predicted_class = 'NSR'
            confidence = nsr_prob

        is_uncertain = confidence < uncertainty_threshold

        return {
            "NSR": nsr_prob,
            "Arrhythmia": arr_prob,
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