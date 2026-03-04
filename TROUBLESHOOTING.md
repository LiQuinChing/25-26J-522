# 🔧 Troubleshooting Guide - MI Detection System

Quick reference for common issues and solutions.

---

## 🚨 Common Issues

### 1. Memory Allocation Error

**Error Message:**
```
numpy.core._exceptions._ArrayMemoryError: Unable to allocate array
```

**Cause:** Insufficient RAM for current configuration

**Solutions (try in order):**

**A. Reduce Image Size** (Recommended)
```yaml
# In config.yaml
image:
  img_height: 64    # From 96
  img_width: 64     # From 96
```

**B. Reduce Batch Size**
```yaml
# In config.yaml
training:
  batch_size: 4     # From 8
```

**C. Reduce Augmentation**
```python
# In src/augmentation.py, line 90
def oversample_minority_classes(..., balance_ratio=0.2):  # From 0.3
```

**D. Close Other Programs**
- Close web browsers
- Close other Python processes
- Close unnecessary applications

**E. Use 64-bit Python**
```bash
python --version
# Should show 64-bit, not 32-bit
```

---

### 2. Model Not Loading in API

**Error Message:**
```
Warning: Model not found at models/best_model.h5
```

**Solution:**
```bash
# Train the model first
cd src
python train.py

# Verify file exists
dir ..\models\best_model.h5
```

---

### 3. Frontend Can't Connect to Backend

**Error Message:**
```
Failed to connect to server. Make sure Flask API is running.
```

**Solutions:**

**A. Check Flask is Running**
```bash
# Should see:
# * Running on http://0.0.0.0:5000
python app.py
```

**B. Test API Directly**
```bash
# In browser or curl
curl http://localhost:5000/api/health

# Should return:
# {"model_loaded": true, "status": "ok"}
```

**C. Check Port 5000**
```bash
# Windows
netstat -ano | findstr :5000

# If occupied, kill process or change port in app.py
```

**D. Verify API URL in Frontend**
```javascript
// In frontend/src/App.js (line 5)
const API_URL = 'http://localhost:5000';  // Should match Flask port
```

---

### 4. CORS Error in Browser

**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Verify CORS is enabled in `app.py`:
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This line enables CORS
```

**If still failing:**
```bash
# Reinstall flask-cors
pip install --upgrade flask-cors
```

---

### 5. Dataset Not Found

**Error Message:**
```
Warning: Folder not found - DataSet/...
```

**Solution:**

**A. Verify Dataset Structure**
```
DataSet/
├── Normal Person ECG Images (859)/
├── ECG Images of Patient that have History of MI (203)/
└── ECG Images of Myocardial Infarction Patients (77)/
```

**B. Check Exact Folder Names**
- Names must match exactly (including spaces and numbers)
- Use quotes if copying: "Normal Person ECG Images (859)"

**C. Verify Location**
```bash
# Dataset should be in project root, not in src/
cd e:\rp
dir DataSet
```

---

### 6. TensorFlow Import Error

**Error Message:**
```
ImportError: No module named 'tensorflow'
```

**Solution:**
```bash
# Install TensorFlow
pip install tensorflow

# Or reinstall all dependencies
pip install -r requirements.txt

# Verify installation
python -c "import tensorflow as tf; print(tf.__version__)"
```

---

### 7. Training Very Slow (CPU)

**Issue:** Training taking hours instead of minutes

**Solutions:**

**A. Install TensorFlow GPU** (if you have NVIDIA GPU)
```bash
pip uninstall tensorflow
pip install tensorflow-gpu

# Requires CUDA and cuDNN installed
```

**B. Use Smaller Model**
```yaml
# In config.yaml
model:
  backbone: "MobileNetV2"  # Fastest option
```

**C. Reduce Epochs**
```yaml
# In config.yaml
training:
  epochs: 25  # From 50
```

**D. Reduce Image Size**
```yaml
# In config.yaml
image:
  img_height: 64
  img_width: 64
```

---

### 8. Overfitting (High Train, Low Val Accuracy)

**Symptoms:**
- Training accuracy: 95%+
- Validation accuracy: 70%-80%

**Solutions:**

**A. Increase Dropout**
```yaml
# In config.yaml
model:
  dropout_rate: 0.7  # From 0.5
```

**B. More Augmentation**
```yaml
# In config.yaml
augmentation:
  rotation_limit: 20      # From 15
  brightness_limit: 0.3   # From 0.2
  contrast_limit: 0.3     # From 0.2
```

**C. Early Stopping**
```yaml
# In config.yaml
callbacks:
  early_stopping:
    patience: 5  # From 10
```

---

### 9. Poor MI Class Performance

**Issue:** Low recall/precision for Myocardial Infarction class

**Solutions:**

**A. Increase Class Weight**
```yaml
# In config.yaml
classes:
  class_weights:
    2: 15.0  # From 11.1 (MI class)
```

**B. More Augmentation for MI**
```python
# In src/augmentation.py
def oversample_minority_classes(..., balance_ratio=0.5):  # From 0.3
```

**C. Collect More MI Samples**
- Dataset currently has only 77 MI images
- Aim for at least 200+ samples

---

### 10. React Build Error

**Error Message:**
```
npm ERR! Failed to compile
```

**Solutions:**

**A. Clear Node Modules**
```bash
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```

**B. Update React Scripts**
```bash
cd frontend
npm install react-scripts@latest
```

**C. Check Node Version**
```bash
node --version
# Should be 14.x or higher

npm --version
# Should be 6.x or higher
```

---

### 11. Prediction Confidence Always Low

**Issue:** All predictions showing 40-60% confidence

**Solutions:**

**A. More Training**
- Model might be underfitted
- Increase epochs or train longer

**B. Check Data Quality**
- Verify ECG images are clear
- Remove corrupted images
- Ensure consistent image quality

**C. Fine-tune Model**
```yaml
# In config.yaml
model:
  freeze_base: false  # Unfreeze ResNet50 for fine-tuning

training:
  learning_rate: 0.00001  # Lower LR for fine-tuning
```

---

### 12. Port Already in Use

**Error Message:**
```
OSError: [Errno 48] Address already in use
```

**Solutions:**

**A. Find Process Using Port**
```bash
# Windows
netstat -ano | findstr :5000
# Note the PID (last column)

taskkill /PID <PID> /F
```

**B. Change Port**
```python
# In app.py (last line)
app.run(debug=True, host='0.0.0.0', port=5001)  # Changed from 5000
```

```javascript
// In frontend/src/App.js
const API_URL = 'http://localhost:5001';  // Match new port
```

---

### 13. Model Predictions All Same Class

**Issue:** Model predicts "Normal" for everything

**Cause:** Model converged to majority class

**Solutions:**

**A. Balance Classes Better**
```python
# In src/augmentation.py
balance_ratio=0.8  # Higher ratio = more balanced
```

**B. Increase Minority Class Weights**
```yaml
# In config.yaml
classes:
  class_weights:
    1: 6.0   # Previous MI
    2: 20.0  # MI (increased significantly)
```

**C. Stratified Validation**
Ensure validation set has representatives of all classes

---

### 14. GPU Not Being Used

**Check if GPU is Available:**
```python
import tensorflow as tf
print("GPU Available:", tf.config.list_physical_devices('GPU'))
```

**If No GPU Detected:**

**A. Install CUDA and cuDNN**
- Download CUDA Toolkit from NVIDIA
- Download cuDNN from NVIDIA
- Add to system PATH

**B. Install TensorFlow GPU**
```bash
pip uninstall tensorflow
pip install tensorflow-gpu
```

**C. Verify Installation**
```python
import tensorflow as tf
print("Built with CUDA:", tf.test.is_built_with_cuda())
print("GPU Name:", tf.config.list_physical_devices('GPU'))
```

---

### 15. Image Upload Failing in Frontend

**Error:** Image preview not showing or upload fails

**Solutions:**

**A. Check Image Format**
- Supported: JPG, JPEG, PNG
- Max size: ~10MB recommended

**B. Check Browser Console**
```
Press F12 → Console tab
Look for error messages
```

**C. Test API Directly**
```bash
curl -X POST -F "image=@test.jpg" http://localhost:5000/api/predict
```

---

## 🔍 Diagnostic Commands

### Check Python Installation
```bash
python --version          # Should be 3.7+
python -m pip --version   # Verify pip works
```

### Check Dependencies
```bash
pip list | findstr tensorflow
pip list | findstr numpy
pip list | findstr opencv
pip list | findstr flask
```

### Check TensorFlow
```python
import tensorflow as tf
print(f"TensorFlow version: {tf.__version__}")
print(f"GPU available: {tf.config.list_physical_devices('GPU')}")
print(f"Built with CUDA: {tf.test.is_built_with_cuda()}")
```

### Check Dataset
```bash
dir DataSet
dir "DataSet\Normal Person ECG Images (859)"
dir "DataSet\ECG Images of Patient that have History of MI (203)"
dir "DataSet\ECG Images of Myocardial Infarction Patients (77)"
```

### Check Model Files
```bash
dir models
dir models\best_model.h5
dir models\final_model.h5
```

### Check Outputs
```bash
dir outputs
dir outputs\training_curves.png
dir outputs\training_log.csv
```

### Test API
```bash
# Health check
curl http://localhost:5000/api/health

# Get classes
curl http://localhost:5000/api/classes
```

---

## 📊 Performance Optimization

### For Faster Training:

1. **Use GPU** (10x faster)
2. **Reduce image size** (2x faster)
3. **Increase batch size** (1.5x faster, needs more memory)
4. **Use smaller model** (MobileNetV2, 3x faster)
5. **Reduce epochs** (proportional speedup)

### For Better Accuracy:

1. **More training epochs**
2. **Larger image size**
3. **More augmentation**
4. **Better class balancing**
5. **Fine-tune entire model** (unfreeze base)

### For Less Memory:

1. **Smaller image size** (64×64)
2. **Smaller batch size** (4 or 2)
3. **Less augmentation** (balance_ratio=0.2)
4. **Smaller model** (MobileNetV2)

---

## 🆘 Emergency Reset

If everything is broken, start fresh:

```bash
# 1. Backup your dataset
xcopy DataSet DataSet_backup /E /I

# 2. Clean Python environment
pip uninstall -y tensorflow keras numpy opencv-python
pip install -r requirements.txt

# 3. Clean frontend
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
cd ..

# 4. Reset configuration
# Download fresh config.yaml from backup

# 5. Retrain model
cd src
python train.py
cd ..

# 6. Test again
start.bat
```

---

## 📞 Getting Help

### Before Asking for Help:

1. ✅ Read error message carefully
2. ✅ Check this troubleshooting guide
3. ✅ Try relevant solutions above
4. ✅ Check README.md and QUICKSTART.md
5. ✅ Search error message online

### Include When Asking:

1. Full error message (screenshot or copy-paste)
2. Python version (`python --version`)
3. TensorFlow version
4. Operating system
5. Steps to reproduce
6. What you've already tried

---

## ✅ Health Check Procedure

Run these to verify system health:

```bash
# 1. Check Python
python --version

# 2. Check dependencies
pip install -r requirements.txt

# 3. Check dataset
dir DataSet

# 4. Test data loading
cd src
python -c "from data_loader import ECGDataLoader; loader = ECGDataLoader(); print('✓ Data loader works')"

# 5. Test model building
python -c "from model import MIDetectionModel; model = MIDetectionModel(); print('✓ Model builder works')"

# 6. Check frontend
cd ..\frontend
npm install
npm start

# 7. Check API
cd ..
python app.py
```

If all pass → System is healthy ✅

---

**Last Updated:** February 11, 2024  
**For More Help:** Check README.md, QUICKSTART.md, or IMPLEMENTATION_STATUS.md
