import torch
import numpy as np
from scipy.signal import butter, filtfilt, resample

# CNN-LSTM model definition
class CNN_LSTM(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.cnn = torch.nn.Sequential(
            torch.nn.Conv1d(2, 32, 7, padding=3),
            torch.nn.ReLU(),
            torch.nn.MaxPool1d(2),
            torch.nn.Dropout(0.2),
            torch.nn.Conv1d(32, 64, 5, padding=2),
            torch.nn.ReLU(),
            torch.nn.MaxPool1d(2),
            torch.nn.Dropout(0.2)
        )
        self.lstm = torch.nn.LSTM(64, 64, batch_first=True)
        self.fc = torch.nn.Linear(64, 1)
    def forward(self, x):
        x = x.permute(0,2,1)  # (B, C, L)
        x = self.cnn(x)
        x = x.permute(0,2,1)  # (B, L, C)
        _, (hn, _) = self.lstm(x)
        return self.fc(hn[-1]).squeeze()

# Signal preprocessing functions
def bandpass_filter(signal, fs=250):
    b, a = butter(4, [0.5/(fs/2), 40/(fs/2)], btype='band')
    return filtfilt(b, a, signal, axis=0)

def normalize(signal):
    return (signal - np.mean(signal)) / (np.std(signal) + 1e-8)

def resample_signal(signal, orig_fs, target_fs=250):
    n_samples = int(len(signal) * target_fs / orig_fs)
    return resample(signal, n_samples)

def segment_signal(signal, window=1250, step=625):
    return np.array([signal[i:i+window] for i in range(0, len(signal)-window, step)])

# Clinical prediction functions
def predict_ecg_clinical(signal, model, device, fs=250, seg_len=1250):
    # Select leads
    if signal.shape[1] >= 7:
        signal = signal[:, [1, 6]]  # Lead II, V5
    else:
        signal = signal[:, :2]

    signal = bandpass_filter(signal, fs)
    signal = normalize(signal)

    segments = segment_signal(signal, window=seg_len)

    if len(segments) < 3:
        return {
            "valid": False,
            "reason": "ECG too short",
            "segment_probs": np.array([])
        }

    model.eval()
    probs = []
    with torch.no_grad():
        for seg in segments:
            seg_tensor = torch.tensor(seg).unsqueeze(0).float().to(device)
            logit = model(seg_tensor)
            probs.append(torch.sigmoid(logit).item())

    probs = np.array(probs)

    # Robust statistics (VERY IMPORTANT)
    p95 = np.percentile(probs, 95)
    p90 = np.percentile(probs, 90)
    p75 = np.percentile(probs, 75)

    ischemic_mask = probs >= 0.5
    ischemic_burden = np.mean(ischemic_mask)

    # Consecutive ischemic segments
    max_run, run = 0, 0
    for x in ischemic_mask:
        run = run + 1 if x else 0
        max_run = max(max_run, run)

    return {
        "valid": True,
        "segment_probs": probs,
        "p95": float(p95),
        "p90": float(p90),
        "p75": float(p75),
        "ischemic_burden": float(ischemic_burden),
        "max_consecutive_segments": int(max_run)
    }

def detect_cad_clinical(result):
    """
    Clinically calibrated CAD decision logic
    """

    if not result.get("valid", False):
        return False

    # Composite ischemia risk score
    cad_score = (
        0.40 * result["p95"] +
        0.25 * result["p90"] +
        0.20 * result["ischemic_burden"] +
        0.15 * (result["max_consecutive_segments"] >= 3)
    )

    result["cad_score"] = float(cad_score)

    # Final decision threshold (validated empirically)
    return cad_score >= 0.55