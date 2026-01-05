from flask import Flask, request, jsonify
from flask_cors import CORS
from keras.models import load_model
import numpy as np
import os
import cv2
import base64
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the trained model
MODEL_PATH = "ptbdb.h5"
model = None

def load_trained_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = load_model(MODEL_PATH)
        print("Model loaded successfully!")
    else:
        print(f"Error: Model file '{MODEL_PATH}' not found. Please train the model first by running main.py")

def validate_ecg_image(image):
    """
    Validate if the uploaded image is likely an ECG image
    Returns (is_valid, error_message)
    """
    try:
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Check image dimensions (ECG images are typically wider than tall)
        height, width = gray.shape
        aspect_ratio = width / height
        
        # ECG images should have horizontal aspect ratio (wider than tall)
        if aspect_ratio < 1.2:
            return False, "Image doesn't appear to be an ECG chart. ECG images should be wider than tall (landscape orientation)."
        
        # Check if image contains line patterns (ECG has wave patterns)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (height * width)
        
        # ECG images should have moderate edge density (not too low, not too high)
        if edge_density < 0.01:
            return False, "Image doesn't contain enough line patterns typical of ECG signals. Please upload a valid ECG chart."
        
        if edge_density > 0.5:
            return False, "Image appears to be too complex or noisy. Please upload a clear ECG chart image."
        
        # Check for grid pattern (ECG paper has grid lines)
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        
        horizontal_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, horizontal_kernel)
        vertical_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, vertical_kernel)
        
        grid_score = (np.sum(horizontal_lines > 0) + np.sum(vertical_lines > 0)) / (height * width)
        
        if grid_score < 0.001:
            return False, "No ECG grid pattern detected. Please upload a proper ECG chart with visible grid lines."
        
        # Check color distribution (ECG images typically have limited colors)
        unique_colors = len(np.unique(gray))
        if unique_colors > 220:
            return False, "Image appears to be a photograph or complex image. Please upload an ECG chart."
        
        return True, "Valid ECG image"
        
    except Exception as e:
        return False, f"Error validating image: {str(e)}"

def process_ecg_image(image_data):
    """
    Process ECG image and extract signal values
    """
    try:
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Convert to grayscale if needed
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Apply threshold to get the ECG line
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours or extract signal
        height, width = binary.shape
        
        # Extract signal by finding darkest points in each column
        signal = []
        step = max(1, width // 187)  # Downsample to 187 points
        
        for i in range(0, width, step):
            if len(signal) >= 187:
                break
            col = binary[:, i]
            # Find the position of the signal (darkest point)
            if np.any(col > 0):
                signal_pos = np.where(col > 0)[0]
                avg_pos = np.mean(signal_pos)
                # Normalize to [-1, 1] range
                normalized_val = 1 - (avg_pos / height) * 2
                signal.append(normalized_val)
        
        # Ensure we have exactly 187 points
        while len(signal) < 187:
            signal.append(signal[-1] if signal else 0)
        signal = signal[:187]
        
        return signal
    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")

@app.route('/')
def home():
    return jsonify({
        "message": "ECG Myocardial Infarction Detection API",
        "status": "running",
        "endpoints": {
            "/predict": "POST - Send ECG data for prediction",
            "/predict_from_images": "POST - Upload ECG images for prediction",
            "/health": "GET - Check API health"
        }
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({
            "error": "Model not loaded. Please train the model first."
        }), 500
    
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if 'ecg_data' not in data:
            return jsonify({
                "error": "Missing 'ecg_data' field in request. Expected array of 187 values."
            }), 400
        
        ecg_data = data['ecg_data']
        
        # Validate input
        if not isinstance(ecg_data, list):
            return jsonify({
                "error": "ecg_data must be an array"
            }), 400
        
        if len(ecg_data) != 187:
            return jsonify({
                "error": f"ecg_data must have exactly 187 values. Got {len(ecg_data)}"
            }), 400
        
        # Prepare data for prediction
        X = np.array(ecg_data).reshape(1, 187, 1)
        
        # Make prediction
        prediction = model.predict(X, verbose=0)
        prediction_value = float(prediction[0][0])
        prediction_class = int(prediction_value > 0.5)
        
        # Return result
        return jsonify({
            "prediction": prediction_class,
            "confidence": prediction_value,
            "result": "Abnormal (Myocardial Infarction)" if prediction_class == 1 else "Normal",
            "message": "0 = Normal ECG, 1 = Abnormal ECG (Myocardial Infarction)"
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/predict_from_images', methods=['POST'])
def predict_from_images():
    if model is None:
        return jsonify({
            "error": "Model not loaded. Please train the model first."
        }), 500
    
    try:
        data = request.get_json()
        
        if 'images' not in data:
            return jsonify({
                "error": "Missing 'images' field. Expected array of base64 encoded images."
            }), 400
        
        images = data['images']
        
        if not isinstance(images, list) or len(images) == 0:
            return jsonify({
                "error": "images must be a non-empty array"
            }), 400
        
        if len(images) > 12:
            return jsonify({
                "error": "Maximum 12 images allowed"
            }), 400
        
        # Process all images and combine signals
        all_signals = []
        invalid_images = []
        
        for idx, img_data in enumerate(images):
            try:
                # Decode base64 to image for validation
                if ',' in img_data:
                    img_data_clean = img_data.split(',')[1]
                else:
                    img_data_clean = img_data
                
                image_bytes = base64.b64decode(img_data_clean)
                image = Image.open(io.BytesIO(image_bytes))
                image_np = np.array(image)
                
                # Convert RGB to BGR for OpenCV
                if len(image_np.shape) == 3:
                    image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
                else:
                    image_cv = image_np
                
                # Validate if it's an ECG image
                is_valid, validation_message = validate_ecg_image(image_cv)
                
                if not is_valid:
                    invalid_images.append({
                        "image_number": idx + 1,
                        "error": validation_message
                    })
                    continue
                
                # Process the validated ECG image
                signal = process_ecg_image(img_data)
                all_signals.extend(signal)
                
            except Exception as e:
                invalid_images.append({
                    "image_number": idx + 1,
                    "error": f"Failed to process image: {str(e)}"
                })
        
        # If all images are invalid, return error
        if len(invalid_images) == len(images):
            return jsonify({
                "error": "None of the uploaded images appear to be valid ECG charts",
                "details": invalid_images,
                "help": "Please upload clear ECG chart images with visible wave patterns and grid lines. Make sure images are in landscape orientation (wider than tall)."
            }), 400
        
        # If some images are invalid, show warning but continue
        if len(invalid_images) > 0:
            warning_message = f"{len(invalid_images)} out of {len(images)} images were rejected"
        else:
            warning_message = None
        
        if len(all_signals) == 0:
            return jsonify({
                "error": "No valid ECG signals could be extracted from the images",
                "invalid_images": invalid_images
            }), 400
        
        # If we have multiple images, we need to combine them intelligently
        # For now, we'll take the average or concatenate and resample
        if len(all_signals) > 187:
            # Resample to 187 points
            indices = np.linspace(0, len(all_signals) - 1, 187).astype(int)
            ecg_data = [all_signals[i] for i in indices]
        elif len(all_signals) < 187:
            # Pad with zeros or repeat
            ecg_data = all_signals + [0] * (187 - len(all_signals))
        else:
            ecg_data = all_signals
        
        # Make prediction
        X = np.array(ecg_data).reshape(1, 187, 1)
        prediction = model.predict(X, verbose=0)
        prediction_value = float(prediction[0][0])
        prediction_class = int(prediction_value > 0.5)
        
        response_data = {
            "prediction": prediction_class,
            "confidence": prediction_value,
            "result": "Abnormal (Myocardial Infarction)" if prediction_class == 1 else "Normal",
            "message": "Prediction successful from image upload",
            "extracted_data": ecg_data,
            "images_processed": len(images) - len(invalid_images),
            "total_images": len(images)
        }
        
        if warning_message:
            response_data["warning"] = warning_message
            response_data["invalid_images"] = invalid_images
        
        return jsonify(response_data)
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    if model is None:
        return jsonify({
            "error": "Model not loaded. Please train the model first."
        }), 500
    
    try:
        data = request.get_json()
        
        if 'ecg_data' not in data:
            return jsonify({
                "error": "Missing 'ecg_data' field in request. Expected array of arrays (each with 187 values)."
            }), 400
        
        ecg_data = data['ecg_data']
        
        if not isinstance(ecg_data, list) or len(ecg_data) == 0:
            return jsonify({
                "error": "ecg_data must be a non-empty array of arrays"
            }), 400
        
        # Prepare data
        X = np.array(ecg_data).reshape(-1, 187, 1)
        
        # Make predictions
        predictions = model.predict(X, verbose=0)
        
        results = []
        for i, pred in enumerate(predictions):
            pred_value = float(pred[0])
            pred_class = int(pred_value > 0.5)
            results.append({
                "sample": i + 1,
                "prediction": pred_class,
                "confidence": pred_value,
                "result": "Abnormal" if pred_class == 1 else "Normal"
            })
        
        return jsonify({
            "predictions": results,
            "total_samples": len(results)
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    load_trained_model()
    print("\n" + "="*50)
    print("ECG Myocardial Infarction Detection API")
    print("="*50)
    print("Server starting on http://localhost:5000")
    print("Use Postman to test the API endpoints")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
