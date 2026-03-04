# 🚀 Quick Start Guide - MI Detection Web App

## Setup (One-time)

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Train the Model (if not already trained)
```bash
cd src
python train.py
cd ..
```

This will create `models/best_model.h5`

---

## Running the Application

### Option A: Automatic Start (Recommended) ⭐

**Windows:**
```powershell
.\START_BOTH.bat
```

**Linux/Mac:**
```bash
chmod +x START_BOTH.sh
./START_BOTH.sh
```

This will:
1. ✅ Start Flask API at http://localhost:5000
2. ✅ Start React UI at http://localhost:3000
3. ✅ Open browser automatically
4. ✅ Ready to upload ECG images!

### Option B: Manual Start

**Terminal 1 - Flask API:**
```bash
python app.py
```

**Terminal 2 - React Frontend:**
```bash
cd frontend
npm start
```

### Option C: Command Line Prediction

```powershell
cd src
python predict.py --model ..\models\best_model.h5 --image path\to\ecg.jpg --visualize
```

---

## Using the Application

1. Open browser to **http://localhost:3000**

2. **Upload an ECG image:**
   - Click the upload box
   - Select an ECG image (JPG, PNG, JPEG)
   - Preview appears automatically

3. **Click "Analyze ECG"**

4. **View Results:**
   - Predicted diagnosis (Normal / Previous MI / Myocardial Infarction)
   - Confidence percentage
   - Probability for all classes

5. **Upload another image:**
   - Click "Reset" button
   - Upload new image

## 📊 Expected Model Performance

Your trained model should provide:
- **Overall accuracy:** 85-95%
- **Normal detection:** ~92% precision
- **MI detection:** ~80-90% recall
- **Confidence scores:** 70-95% for most predictions

---

## API Endpoints

### Health Check
```
GET http://localhost:5000/api/health
```

### Predict from Image
```
POST http://localhost:5000/api/predict
Content-Type: multipart/form-data
Body: image=<file>
```

Response:
```json
{
  "success": true,
  "predicted_class": "Normal",
  "confidence": 0.95,
  "all_probabilities": {
    "Normal": 0.95,
    "Previous_MI": 0.03,
    "Myocardial_Infarction": 0.02
  }
}
```

---

## Troubleshooting

### Model Not Found
```
Error: Model not loaded. Please train the model first.
```
**Solution:** Run `python src/train.py` to train the model

### Port Already in Use
```
Error: Address already in use
```
**Solution:** 
- Kill existing process on port 5000: `netstat -ano | findstr :5000`
- Or change port in `app.py`

### Frontend Can't Connect to API
```
Error: Failed to connect to server
```
**Solution:**
- Ensure Flask API is running on port 5000
- Check `http://localhost:5000/api/health` in browser

### CORS Errors
**Solution:** Already handled by `flask-cors` package

---

## Project Structure

```
rp/
├── app.py                  # Flask API server
├── start.bat               # Windows startup script
├── start.sh                # Linux/Mac startup script
├── config.yaml             # Configuration
├── requirements.txt        # Python dependencies
├── models/
│   └── best_model.h5      # Trained model
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── App.css        # Styling
│   └── package.json       # Node dependencies
└── src/
    ├── train.py           # Model training
    ├── predict.py         # Prediction logic
    └── ...
```

---

## Features

✅ Upload ECG images (JPG, PNG, JPEG)  
✅ Real-time AI prediction  
✅ Confidence scores  
✅ Probability visualization  
✅ Beautiful, responsive UI  
✅ Medical disclaimer  
✅ Error handling  

---

## Notes

⚠️ **Disclaimer:** This is a research tool and should NOT be used for clinical diagnosis. Always consult a qualified healthcare professional.

📊 **Model Performance:** 
- Training on 1,136 ECG images
- 3 classes: Normal, Previous MI, Myocardial Infarction
- ResNet50 transfer learning
- Expected accuracy: 85-95%

🎯 **Use Cases:**
- Research and education
- Quick screening tool
- ECG pattern recognition demos
- Medical AI demonstrations
