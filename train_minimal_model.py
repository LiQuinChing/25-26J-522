"""Train a minimal SVT model using ONLY the 5 user-provided inputs."""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib

print("=" * 70)
print("Training Minimal SVT Model (5 User Inputs Only)")
print("=" * 70)

# Load data  
df = pd.read_csv('good_ecg.csv')
print(f"\nLoaded {len(df)} samples")

# Encode target
svt_labels = {'A', 'a', 'J', 'S', 'SVT', 'SVEB'}
healthy_labels = {'N', 'Normal', 'NSR', 'Healthy', '0'}

y = df['type'].apply(lambda x: 1 if str(x).strip() in svt_labels else (
    0 if str(x).strip() in healthy_labels else np.nan))
keep = y.notna()
df = df[keep].reset_index(drop=True)
y = y[keep].astype(int).values

print(f"After filtering: Healthy={sum(y==0)}, SVT={sum(y==1)}")

# Extract ONLY the 5 minimal features that users provide
def extract_minimal_features(df_input):
    """Extract minimal features matching user inputs."""
    features = pd.DataFrame()
    
    # 1. Heart Rate from RR intervals
    pre_rr = pd.to_numeric(df_input.get('0_pre-RR', np.nan), errors='coerce')
    post_rr = pd.to_numeric(df_input.get('0_post-RR', np.nan), errors='coerce')
    rr_mean = (pre_rr + post_rr) / 2.0
    rr_seconds = rr_mean / 360.0  # Sampling rate is 360 Hz (verified from QRS durations)
    features['heart_rate_bpm'] = (60.0 / rr_seconds).replace([np.inf, -np.inf], np.nan)
    
    # 2. PR Interval  
    pq_int = pd.to_numeric(df_input.get('0_pq_interval', np.nan), errors='coerce')
    features['pr_interval_s'] = pq_int / 360.0
    
    # 3. QRS Duration
    qrs_int = pd.to_numeric(df_input.get('0_qrs_interval', np.nan), errors='coerce')
    features['qrs_duration_s'] = qrs_int / 360.0
    
    # 4. RR Regularity (1=irregular, 0=regular)
    rr_diff = (pre_rr - post_rr).abs()
    rr_variation = rr_diff / (rr_mean + 1e-6)
    features['rr_regularity'] = (rr_variation > 0.12).astype(float)  # 1=irregular
    
    # 5. P-wave Presence (1=present, 0=absent)
    p_peak = pd.to_numeric(df_input.get('0_pPeak', np.nan), errors='coerce').abs()
    features['p_wave_presence'] = (p_peak > 0.02).astype(float)  # 1=present
    
    return features

print("\nExtracting minimal features...")
X = extract_minimal_features(df)

# Remove rows with missing values  
valid = X.notna().all(axis=1)
X = X[valid].values
y = y[valid]

print(f"Valid samples after removing NaN: {len(X)}")
print(f"  Healthy: {sum(y==0)}")
print(f"  SVT: {sum(y==1)}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTrain: {len(X_train)} samples (SVT={sum(y_train==1)})")
print(f"Test: {len(X_test)} samples (SVT={sum(y_test==1)})")

# Train model with balanced class weights  
print("\nTraining Random Forest...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=10,
    min_samples_leaf=5,
    class_weight='balanced',
    n_jobs=-1,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("\n" + "=" * 70)
print("Model Performance")
print("=" * 70)
print(classification_report(y_test, y_pred, target_names=['Healthy', 'SVT']))

print("\nConfusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"  True Negatives:  {cm[0,0]:,}")
print(f"  False Positives: {cm[0,1]:,}")
print(f"  False Negatives: {cm[1,0]:,}")
print(f"  True Positives:  {cm[1,1]:,}")

print(f"\nROC AUC: {roc_auc_score(y_test, y_proba):.4f}")

# Feature importance
feature_names = ['heart_rate_bpm', 'pr_interval_s', 'qrs_duration_s', 
                 'rr_regularity', 'p_wave_presence']
importances = model.feature_importances_
print("\nFeature Importances:")
for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
    print(f"  {name:20s}: {imp:.4f}")

# Set threshold for medical screening (high sensitivity)
# For SVT detection, false negatives are more costly than false positives
from sklearn.metrics import f1_score

optimal_threshold = 0.25  # 25% threshold for high sensitivity

y_pred_opt = (y_proba >= optimal_threshold).astype(int)

from sklearn.metrics import recall_score, precision_score
recall_opt = recall_score(y_test, y_pred_opt)
precision_opt = precision_score(y_test, y_pred_opt)
f1_opt = f1_score(y_test, y_pred_opt)

print(f"\nUsing threshold: {optimal_threshold:.3f} (F1={f1_opt:.3f}, Recall={recall_opt:.1%}, Precision={precision_opt:.1%})")
print("(Lower threshold chosen for medical screening - prioritizing sensitivity)")

# Save model
save_path = 'models/svt_minimal_model.joblib'
model_bundle = {
    'model': model,
    'feature_names': feature_names,
    'threshold': optimal_threshold,
    'class_names': ['Healthy', 'SVT']
}

joblib.dump(model_bundle, save_path)
print(f"\nModel saved to: {save_path}")

# Test with examples
print("\n" + "=" * 70)
print("Testing with Example Cases")
print("=" * 70)

test_cases = [
    {
        'name': 'SVT: High HR, irregular, no P-wave',
        'values': np.array([[165, 0.10, 0.08, 1, 0]])  # irregular=1, no P-wave=0
    },
    {
        'name': 'Healthy: Normal HR, regular, P-wave present',
        'values': np.array([[75, 0.16, 0.10, 0, 1]])  # regular=0, P-wave=1
    },
    {
        'name': 'SVT: Very high HR, regular, no P-wave',
        'values': np.array([[180, 0.10, 0.08, 0, 0]])  # regular=0, no P-wave=0
    }
]

for case in test_cases:
    proba = model.predict_proba(case['values'])[0, 1]
    pred = 1 if proba >= optimal_threshold else 0
    label = 'SVT' if pred == 1 else 'Healthy'
    print(f"\n{case['name']}:")
    print(f"  Prediction: {label}")
    print(f"  SVT Probability: {proba:.1%}")
    print(f"  Threshold: {optimal_threshold:.1%}")

print("\n" + "=" * 70)
print("✓ Training Complete!")
print("=" * 70)
