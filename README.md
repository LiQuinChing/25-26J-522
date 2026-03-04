# Myocardial Infarction Detection from ECG Images

Deep learning model for detecting Myocardial Infarction (MI) from ECG strip images using transfer learning and CNNs.

## 📋 Project Overview

This project implements a deep learning pipeline to classify ECG images into three categories:
- **Normal**: Healthy ECG patterns
- **Previous MI**: Patients with history of myocardial infarction
- **Myocardial Infarction**: Current/acute MI patients

## 🗂️ Dataset Structure

```
DataSet/
├── Normal Person ECG Images (859)/          # 859 normal ECG images
├── ECG Images of Patient that have History of MI (203)/  # 203 previous MI
└── ECG Images of Myocardial Infarction Patients (77)/    # 77 acute MI
```

**Total Images**: 1,139 ECG images  
**Challenge**: Severely imbalanced dataset (75% Normal, 18% Previous MI, 7% MI)

## 🏗️ Project Structure

```
rp/
├── config.yaml                 # Configuration file
├── requirements.txt            # Python dependencies
├── app.py                      # Flask API server
├── DataSet/                    # ECG image dataset
├── frontend/                   # React web application
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── App.css            # Styles
│   │   └── index.js           # Entry point
│   ├── public/
│   └── package.json
├── src/
│   ├── data_loader.py         # Data loading and preprocessing
│   ├── augmentation.py        # Data augmentation pipeline
│   ├── model.py               # CNN model architecture
│   ├── train.py               # Training pipeline
│   ├── evaluate.py            # Model evaluation
│   └── predict.py             # Inference script
├── models/                     # Saved models
├── outputs/                    # Training logs and results
└── notebooks/                  # Jupyter notebooks

```

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Train the Model

```bash
cd src
python train.py
```

This will:
- Load and preprocess ECG images
- Apply data augmentation to balance classes
- Train ResNet50-based model with transfer learning
- Save best model to `models/best_model.h5`
- Generate training curves and logs

### 4. Run the Web Application

**Terminal 1 - Start Flask API:**
```bash
python app.py
```

**Terminal 2 - Start React Frontend:**
```bash
cd frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser and upload ECG images!

### 5. Evaluate the Model (Optional)

```bash
cd src
python evaluate.py
```

Generates:
- Confusion matrix
- Classification report (precision, recall, F1-score)
- ROC curves
- Per-class performance metrics

### 4. Make Predictions

**Single Image:**
```bash
python predict.py --model ../models/best_model.h5 --image path/to/ecg.jpg --visualize
```

**Batch Prediction:**
```bash
python predict.py --model ../models/best_model.h5 --folder path/to/images --output results.csv
```

## 🔧 Configuration

Edit `config.yaml` to customize:

```yaml
# Model settings
model:
  backbone: "ResNet50"          # ResNet50, EfficientNetB0, DenseNet121
  pretrained: true              # Use ImageNet pre-trained weights
  freeze_base: true             # Freeze base model layers
  dropout_rate: 0.5

# Training settings
training:
  batch_size: 32
  epochs: 50
  learning_rate: 0.0001

# Class weights (for imbalanced data)
classes:
  class_weights:
    0: 1.0    # Normal
    1: 4.2    # Previous MI
    2: 11.1   # Myocardial Infarction
```

## 📊 Model Architecture

- **Base Model**: ResNet50 (pre-trained on ImageNet)
- **Custom Head**: 
  - Global Average Pooling
  - Dense(512) + BatchNorm + Dropout(0.5)
  - Dense(256) + BatchNorm + Dropout(0.5)
  - Dense(128) + Dropout(0.25)
  - Dense(3, softmax)

**Total Parameters**: ~25M (23M frozen, 2M trainable)

## 🎯 Handling Class Imbalance

The project addresses severe class imbalance through:

1. **Data Augmentation**: 
   - Rotation (±15°)
   - Horizontal flipping
   - Brightness/contrast adjustment
   - Zoom and scaling
   - Gaussian noise and blur

2. **Class Weights**: Weighted loss function (11.1× weight for MI class)

3. **Oversampling**: Generate synthetic samples for minority classes

4. **Stratified Splitting**: Maintain class distribution in train/val/test sets

## 📈 Expected Performance

With proper training:
- **Overall Accuracy**: 85-95%
- **MI Detection Recall**: 80-90% (critical for medical applications)
- **Normal Precision**: 90-95%

## 🔬 Training Process

The training pipeline includes:

1. **Data Loading**: Load and normalize ECG images (224×224)
2. **Data Balancing**: Oversample minority classes with augmentation
3. **Model Training**: Transfer learning with frozen base + trainable head
4. **Callbacks**:
   - ModelCheckpoint: Save best model
   - EarlyStopping: Prevent overfitting (patience=10)
   - ReduceLROnPlateau: Adaptive learning rate
   - TensorBoard: Real-time monitoring
5. **Evaluation**: Test on held-out set with comprehensive metrics

## 📁 Output Files

After training, you'll find:

```
models/
├── best_model.h5              # Best model (highest val accuracy)
└── final_model.h5             # Final model after all epochs

outputs/
├── training_curves.png        # Accuracy/loss curves
├── confusion_matrix.png       # Confusion matrix visualization
├── roc_curves.png            # ROC curves for all classes
├── training_log.csv          # Epoch-by-epoch metrics
├── training_history.json     # Complete training history
└── evaluation_results.json   # Test set performance
```

## 🎓 Usage Examples

### Training with Custom Settings

```python
from train import ModelTrainer

trainer = ModelTrainer(config_path="config.yaml")
history = trainer.train(
    use_augmentation=True,
    balance_classes=True
)
```

### Prediction with Confidence Scores

```python
from predict import MIPredictor

predictor = MIPredictor(model_path="models/best_model.h5")
results = predictor.predict_single("test_ecg.jpg", show_image=True)

print(f"Predicted: {results['predicted_class']}")
print(f"Confidence: {results['confidence']:.2%}")
```

## 🔍 Model Evaluation

```python
from evaluate import ModelEvaluator

evaluator = ModelEvaluator()
results = evaluator.complete_evaluation("models/best_model.h5")
```

Outputs:
- Per-class precision, recall, F1-score
- Confusion matrix (normalized and absolute)
- ROC-AUC scores for each class
- Overall accuracy

## 🛠️ Troubleshooting

**Issue: Low MI class recall**
- Increase class weight for MI class in `config.yaml`
- Apply more aggressive augmentation
- Consider collecting more MI samples

**Issue: Overfitting**
- Increase dropout rate
- Add more augmentation
- Reduce model complexity
- Use early stopping

**Issue: Long training time**
- Reduce image size in config
- Decrease batch size
- Use smaller backbone (MobileNetV2)
- Enable GPU acceleration

## 📝 License

This project is for educational and research purposes.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Contact

For questions or issues, please open a GitHub issue.

---

**Note**: This model is for research purposes only and should not be used for clinical diagnosis without proper validation and regulatory approval.
