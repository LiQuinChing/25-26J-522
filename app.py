"""
Flask API for MI Detection
Serves model predictions via REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import os
from pathlib import Path
import sys

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.predict import MIPredictor

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize predictor
MODEL_PATH = "models/best_model.h5"
predictor = None

def load_predictor():
    """Load the model predictor"""
    global predictor
    if os.path.exists(MODEL_PATH):
        predictor = MIPredictor(MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
    else:
        print(f"Warning: Model not found at {MODEL_PATH}")
        print("Please train the model first by running: python src/train.py")

def validate_ecg_image(img):
    """
    Perform heuristic checks to determine if image looks like an ECG
    Returns (is_valid, warning_message)
    """
    warnings = []
    
    # Convert to grayscale for analysis
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    
    # Check 1: Color distribution (ECGs are typically grayscale or limited colors)
    color_variance = np.std(img, axis=(0, 1))
    
    # If high color variance across all channels, likely not an ECG
    if np.mean(color_variance) > 50:
        warnings.append("Image has high color variance (ECGs are typically grayscale)")
    
    # Check 2: Edge density (ECGs have characteristic line patterns)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    
    # Very low edge density suggests not an ECG (no signal lines)
    if edge_density < 0.02:
        warnings.append("Image lacks characteristic ECG signal patterns")
    
    # Very high edge density suggests complex photo, not ECG
    if edge_density > 0.25:
        warnings.append("Image is too complex (ECGs have simpler line patterns)")
    
    # Check 3: Brightness check (ECGs typically have a bright background)
    mean_brightness = np.mean(gray)
    if mean_brightness < 100:
        warnings.append("Image appears too dark for a typical ECG")
    
    # Check 4: Contrast check (ECGs need good contrast between lines and background)
    contrast = np.std(gray)
    if contrast < 20:
        warnings.append("Image has insufficient contrast for ECG signal detection")
    
    # Check 5: Histogram analysis (ECGs typically have bimodal distribution)
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    hist = hist.flatten() / hist.sum()
    
    # Check if mostly uniform (photos) vs bimodal (ECGs - background + lines)
    entropy = -np.sum(hist * np.log2(hist + 1e-7))
    if entropy > 6.5:
        warnings.append("Image intensity distribution doesn't match typical ECG patterns")
    
    # Must pass at least some basic checks to be considered valid
    # Allow up to 1 minor warning, but reject if multiple issues
    return len(warnings) <= 1, warnings

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': predictor is not None
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Predict MI from uploaded ECG image"""
    if predictor is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded. Please train the model first.'
        }), 503
    
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file provided'
        }), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400
    
    try:
        # Read image from upload
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({
                'success': False,
                'error': 'Could not decode image file. Please upload a valid JPG, PNG, or JPEG image.'
            }), 400
        
        # Check if image is too small
        if img.shape[0] < 50 or img.shape[1] < 50:
            return jsonify({
                'success': False,
                'error': 'Image is too small. Please upload a higher resolution image.'
            }), 400
        
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Validate if image looks like an ECG
        is_valid_ecg, validation_warnings = validate_ecg_image(img)
        
        # Log validation results for debugging
        print(f"\n[VALIDATION] Image: {file.filename}")
        print(f"[VALIDATION] Is valid ECG: {is_valid_ecg}")
        print(f"[VALIDATION] Warnings: {validation_warnings}")
        
        # Block prediction if image doesn't look like an ECG
        if not is_valid_ecg:
            print(f"[REJECTED] Image rejected - not a valid ECG")
            return jsonify({
                'success': False,
                'error': 'The uploaded image does not appear to be a valid ECG image',
                'validation': {
                    'is_likely_ecg': False,
                    'warnings': validation_warnings
                }
            }), 400
        
        # Image passed validation
        print(f"[ACCEPTED] Image passed validation, proceeding with prediction")
        
        # Resize and normalize (using config dimensions)
        img_size = predictor.config['image']['img_height']
        img = cv2.resize(img, (img_size, img_size))
        img = img.astype(np.float32) / 255.0
        
        # Add batch dimension
        img_batch = np.expand_dims(img, axis=0)
        
        # Predict
        predictions = predictor.model.predict(img_batch, verbose=0)[0]
        
        # Get predicted class
        predicted_class_idx = int(np.argmax(predictions))
        predicted_class = predictor.class_names[predicted_class_idx]
        confidence = float(predictions[predicted_class_idx])
        
        # Create response
        result = {
            'success': True,
            'predicted_class': predicted_class,
            'predicted_class_index': predicted_class_idx,
            'confidence': confidence,
            'all_probabilities': {
                class_name: float(prob) 
                for class_name, prob in zip(predictor.class_names, predictions)
            },
            'validation': {
                'is_likely_ecg': is_valid_ecg,
                'warnings': validation_warnings
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/classes', methods=['GET'])
def get_classes():
    """Get class information"""
    if predictor is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    return jsonify({
        'classes': predictor.class_names,
        'descriptions': {
            'Normal': 'Healthy ECG pattern with no abnormalities',
            'Previous_MI': 'Patient with history of myocardial infarction',
            'Myocardial_Infarction': 'Current or acute myocardial infarction detected'
        }
    })

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', '5000'))
    load_predictor()
    print("\n" + "="*70)
    print(" " * 20 + "MI DETECTION API SERVER")
    print("="*70)
    print(f"\nServer running at: http://localhost:{port}")
    print("API Endpoints:")
    print("  • GET  /api/health      - Health check")
    print("  • POST /api/predict     - Predict from image")
    print("  • GET  /api/classes     - Get class information")
    print("\nPress Ctrl+C to stop the server")
    print("="*70 + "\n")
    
    app.run(debug=False, host='0.0.0.0', port=port)
