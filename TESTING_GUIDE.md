# Testing Guide - ECG Image Validation

## Quick Start

### 1. Start Backend Server
```bash
cd "c:\Users\Ravindu\Downloads\Compressed\Abnormal_ECG_Myocardial_infraction_cnn-main\Abnormal_ECG_Myocardial_infraction_cnn-main"
python api_server.py
```
✅ Server should start on http://localhost:5000

### 2. Start Frontend (New Terminal)
```bash
cd "c:\Users\Ravindu\Downloads\Compressed\Abnormal_ECG_Myocardial_infraction_cnn-main\Abnormal_ECG_Myocardial_infraction_cnn-main\frontend"
npm start
```
✅ Frontend should open on http://localhost:3000

## Test Scenarios

### ✅ Test 1: Valid ECG Images
**What to do:**
1. Click "🖼️ Image Upload" tab
2. Click "📁 Choose ECG Images"
3. Select actual ECG chart images (with grid lines and wave patterns)
4. Click "🚀 Upload & Analyze"

**Expected Result:**
- Images should be accepted
- Prediction result shows (Normal or Abnormal)
- No error messages
- ECG chart visualization appears

---

### ❌ Test 2: Random Photos
**What to do:**
1. Upload a photo of a person, landscape, or object
2. Click "🚀 Upload & Analyze"

**Expected Result:**
- Error message appears: 
  - "Image appears to be a photograph or complex image. Please upload an ECG chart."
  - OR "No ECG grid pattern detected."
- No prediction is made
- Red error box shows rejected image details

---

### ❌ Test 3: Portrait Images
**What to do:**
1. Upload an image that is taller than wide (portrait orientation)
2. Click "🚀 Upload & Analyze"

**Expected Result:**
- Error message: "Image doesn't appear to be an ECG chart. ECG images should be wider than tall (landscape orientation)."
- Image is rejected

---

### ❌ Test 4: Text Documents
**What to do:**
1. Upload a screenshot of text or a document
2. Click "🚀 Upload & Analyze"

**Expected Result:**
- Error message: "No ECG grid pattern detected. Please upload a proper ECG chart with visible grid lines."
- Image is rejected

---

### ⚠️ Test 5: Mixed Images (Valid + Invalid)
**What to do:**
1. Upload multiple images including:
   - 2 valid ECG charts
   - 1 random photo
   - 1 document
2. Click "🚀 Upload & Analyze"

**Expected Result:**
- Valid ECG images are processed
- Prediction result shows
- Yellow warning box appears: "2 out of 4 images were rejected"
- Red box lists rejected images with specific reasons
- Prediction is based on valid images only

---

### ✅ Test 6: Multiple Valid ECG Images
**What to do:**
1. Upload 3-5 valid ECG chart images
2. Click "🚀 Upload & Analyze"

**Expected Result:**
- All images accepted
- Signals combined and processed
- Single prediction result for combined data
- Message: "X images processed"

---

## Understanding Error Messages

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "ECG images should be wider than tall" | Image is in portrait orientation | Use landscape ECG images |
| "doesn't contain enough line patterns" | Image too simple/blank | Upload actual ECG with wave patterns |
| "appears to be a photograph" | Too many colors/complexity | Use ECG chart images, not photos |
| "No ECG grid pattern detected" | Missing grid lines | Upload ECG with visible grid |
| "Image appears to be too complex" | Too much noise | Use clearer ECG images |

## Validation Indicators

### ✅ Valid ECG Image Characteristics:
- Landscape orientation (wider than tall)
- Clear grid lines visible
- Wave patterns (ECG signal)
- Limited color palette (usually black/blue lines on white/pink background)
- Graph paper style background

### ❌ Invalid Image Characteristics:
- Portrait orientation
- No grid lines
- Photos of people/objects
- Text documents
- Random images
- Overly complex/noisy images

## Frontend UI Components

### Upload Instructions Box (Blue)
Shows requirements for valid ECG images

### Warning Box (Yellow)
Appears when some images are rejected but others processed

### Error Box (Red - "Rejected Images")
Lists specific images that were rejected with reasons

### Error Box (Red - General)
Shows when all images are rejected or system error occurs

## API Testing with Postman (Optional)

### Test Valid ECG Validation
```http
POST http://localhost:5000/predict_from_images
Content-Type: application/json

{
  "images": [
    "data:image/png;base64,iVBORw0KG..."
  ]
}
```

**Success Response (200):**
```json
{
  "prediction": 0,
  "confidence": 0.23,
  "result": "Normal",
  "images_processed": 1,
  "total_images": 1
}
```

**Error Response (400):**
```json
{
  "error": "None of the uploaded images appear to be valid ECG charts",
  "details": [{
    "image_number": 1,
    "error": "No ECG grid pattern detected..."
  }],
  "help": "Please upload clear ECG chart images..."
}
```

## Troubleshooting

### Problem: Server not starting
**Solution:** 
- Check if port 5000 is available
- Make sure `ptbdb.h5` model file exists
- Install required packages: `pip install flask flask-cors keras opencv-python pillow numpy`

### Problem: Frontend not connecting to API
**Solution:**
- Verify backend is running on http://localhost:5000
- Check API status indicator at top of page
- Open browser console (F12) to see error details

### Problem: All images getting rejected
**Solution:**
- Make sure you're uploading actual ECG chart images
- Check image is in landscape orientation
- Verify image has visible grid lines
- Try different ECG image sources

### Problem: Images accepted but wrong prediction
**Solution:**
- This is normal - validation doesn't guarantee prediction accuracy
- Validation only checks if image is an ECG chart
- Prediction depends on the actual ECG patterns

## Getting Valid ECG Test Images

### Sources:
1. **PhysioNet Database**: https://physionet.org/
2. **Medical image repositories**
3. **ECG simulator software**
4. **Medical textbooks (open access)**

### Image Requirements:
- Format: JPG or PNG
- Orientation: Landscape (wider than tall)
- Content: Clear ECG wave patterns with grid
- Size: Any reasonable size (will be resized automatically)

## Success Indicators

✅ **Everything Working When:**
- Valid ECG images are accepted and processed
- Invalid images are rejected with clear messages
- Mixed uploads show warnings and process valid ones
- Predictions appear with confidence scores
- ECG chart visualization displays

---

**Need Help?** 
Check [ECG_VALIDATION_IMPLEMENTATION.md](ECG_VALIDATION_IMPLEMENTATION.md) for technical details.
