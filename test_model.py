"""
Quick test script to verify the trained model works
"""
import sys
import os
sys.path.append('src')

from src.predict import MIPredictor
import glob

print("="*60)
print("MI DETECTION MODEL - QUICK TEST")
print("="*60)

# Load model
model_path = "models/best_model.h5"
print(f"\n[1/3] Loading model from: {model_path}")

try:
    predictor = MIPredictor(model_path)
    print("✓ Model loaded successfully!")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    sys.exit(1)

# Test on each class
print("\n[2/3] Testing predictions on sample images...")
print("-"*60)

test_images = {
    "Normal": glob.glob("DataSet/Normal Person ECG Images (859)/*.jpg")[0],
    "MI": glob.glob("DataSet/ECG Images of Myocardial Infarction Patients (77)/*.jpg")[0],
    "Previous_MI": glob.glob("DataSet/ECG Images of Patient that have History of MI (203)/*.jpg")[0]
}

results = []
for true_class, image_path in test_images.items():
    print(f"\nTesting: {true_class}")
    print(f"Image: {os.path.basename(image_path)}")
    
    try:
        result = predictor.predict_single(image_path, show_image=False)
        predicted = result['predicted_class']
        confidence = result['confidence']
        
        status = "✓ CORRECT" if predicted == true_class else "✗ INCORRECT"
        print(f"Predicted: {predicted} ({confidence:.1f}% confidence) {status}")
        
        results.append({
            'true': true_class,
            'predicted': predicted,
            'confidence': confidence,
            'correct': predicted == true_class
        })
    except Exception as e:
        print(f"✗ Error: {e}")

# Summary
print("\n[3/3] Test Summary")
print("-"*60)
correct = sum(1 for r in results if r['correct'])
total = len(results)
accuracy = (correct / total * 100) if total > 0 else 0

print(f"Accuracy: {correct}/{total} ({accuracy:.1f}%)")
print(f"\nModel Status: {'✓ WORKING PROPERLY' if correct > 0 else '✗ NEEDS ATTENTION'}")

print("\n" + "="*60)
print("MODEL TEST COMPLETE")
print("="*60)
print("\nTo use the model:")
print("1. API Server: python app.py")
print("2. Single prediction: python src/predict.py --model models/best_model.h5 --image path/to/image.jpg")
print("3. Batch prediction: python src/predict.py --model models/best_model.h5 --folder path/to/folder")
