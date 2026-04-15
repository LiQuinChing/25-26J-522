"""
Simple Model Demo - Runs predictions on sample ECG images
"""
import tensorflow as tf
import numpy as np
import cv2
import os

print("="*70)
print(" "*15 + "MI DETECTION - TRAINED MODEL DEMO")
print("="*70)

# Load the trained model
model_path = "models/best_model.h5"
print(f"\nLoading model from: {model_path}")

try:
    model = tf.keras.models.load_model(model_path)
    print("✓ Model loaded successfully!\n")
    
    # Model summary
    print("Model Architecture:")
    print(f"  - Input shape: {model.input_shape}")
    print(f"  - Output classes: {model.output_shape[1]}")
    print(f"  - Total parameters: {model.count_params():,}")
    
except Exception as e:
    print(f"✗ Error loading model: {e}")
    exit(1)

# Define classes
classes = ["MI", "Normal", "Previous_MI"]

# Function to preprocess image
def preprocess_image(image_path, target_size=(224, 224)):
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, target_size)
    img = img.astype('float32') / 255.0
    return np.expand_dims(img, axis=0)

# Test predictions
print("\n" + "="*70)
print("TESTING PREDICTIONS")
print("="*70)

test_cases = [
    ("DataSet/Normal Person ECG Images (859)/Normal (1).jpg", "Normal"),
    ("DataSet/ECG Images of Myocardial Infarction Patients (77)/MI (1).jpg", "MI"),
    ("DataSet/ECG Images of Patient that have History of MI (203)/Previous_MI (1).jpg", "Previous_MI")
]

results = []
for img_path, true_label in test_cases:
    if not os.path.exists(img_path):
        print(f"\n✗ Image not found: {img_path}")
        continue
    
    print(f"\n{os.path.basename(img_path)}")
    print(f"  True label: {true_label}")
    
    # Preprocess and predict
    img = preprocess_image(img_path)
    predictions = model.predict(img, verbose=0)[0]
    
    # Get predicted class
    pred_idx = np.argmax(predictions)
    pred_class = classes[pred_idx]
    confidence = predictions[pred_idx] * 100
    
    # Display results
    print(f"  Predicted: {pred_class} ({confidence:.1f}% confidence)")
    
    # Show all probabilities
    print(f"  Probabilities:")
    for i, class_name in enumerate(classes):
        prob = predictions[i] * 100
        bar = "█" * int(prob / 5)
        print(f"    {class_name:12s}: {prob:5.1f}% {bar}")
    
    # Check if correct
    is_correct = pred_class == true_label
    print(f"  Result: {'✓ CORRECT' if is_correct else '✗ INCORRECT'}")
    results.append(is_correct)

# Summary
print("\n" + "="*70)
print("SUMMARY")
print("="*70)
correct = sum(results)
total = len(results)
accuracy = (correct / total * 100) if total > 0 else 0

print(f"\nTest Accuracy: {correct}/{total} ({accuracy:.0f}%)")
print(f"Model Status: {'✓ WORKING' if accuracy >= 66 else '⚠ NEEDS REVIEW'}")

print("\n" + "="*70)
print("HOW TO USE THE MODEL:")
print("="*70)
print("\n1. Start API Server:")
print("   python app.py")
print("   API will be available at: http://localhost:5000")

print("\n2. Make predictions:")
print('   python src/predict.py --model models/best_model.h5 --image "path/to/ecg.jpg"')

print("\n3. Full application (API + UI):")
print("   START_BOTH.bat")
print("   Access UI at: http://localhost:3000")

print("\n" + "="*70)
