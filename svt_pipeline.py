"""Shared SVT feature extraction and prediction helpers.

The SVT model is intentionally trained on a small clinical feature set so it
can accept manual input, MIT-BIH beat-feature CSVs, and digitized ECG
time-series CSVs through the same contract.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Iterable

import numpy as np
import pandas as pd


FEATURE_NAMES = [
    "heart_rate_bpm",
    "pr_interval_s",
    "qrs_duration_s",
    "rr_regularity",
    "p_wave_presence",
]

SVT_LABELS = {"A", "a", "J", "j", "S", "s", "SVEB", "SVT"}
HEALTHY_LABELS = {"N", "Normal", "NSR", "Healthy", "0"}
TIME_COLUMN_CANDIDATES = {"time", "time_s", "seconds", "sec", "timestamp"}


@dataclass
class FeatureExtractionResult:
    features: pd.DataFrame
    source: str
    messages: list[str]
    metadata: dict


def load_csv(source: str | Path | BinaryIO) -> pd.DataFrame:
    """Load a CSV from a path or file object."""
    return pd.read_csv(source)


def encode_svt_target(df: pd.DataFrame) -> pd.Series:
    """Map beat labels to binary Healthy/SVT labels and leave others as NaN."""
    if "type" not in df.columns:
        raise ValueError("Training CSV must include a 'type' label column.")

    labels = df["type"].astype(str).str.strip()
    return labels.apply(
        lambda value: 1 if value in SVT_LABELS else (0 if value in HEALTHY_LABELS else np.nan)
    )


def infer_sampling_rate_hz(df: pd.DataFrame, default_hz: float = 360.0) -> pd.Series:
    """Infer sampling rate per row from MIT-BIH record numbers.

    MIT-BIH Arrhythmia Database records (for example 100-234) use 360 Hz.
    MIT-BIH Supraventricular Arrhythmia Database records (800-series) use
    128 Hz. If the record number is missing, fall back to default_hz.
    """
    if "record" not in df.columns:
        return pd.Series(default_hz, index=df.index, dtype=float)

    records = pd.to_numeric(df["record"], errors="coerce")
    rates = pd.Series(default_hz, index=df.index, dtype=float)
    rates.loc[(records >= 800) & (records < 900)] = 128.0
    return rates


def extract_features_from_beat_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Extract the 5 clinical SVT features from MIT-BIH beat-feature CSV rows."""
    sample_rate = infer_sampling_rate_hz(df)

    pre_rr = _first_numeric_column(df, ["0_pre-RR", "pre-RR", "pre_rr", "rr_pre", "1_pre-RR"])
    post_rr = _first_numeric_column(df, ["0_post-RR", "post-RR", "post_rr", "rr_post", "1_post-RR"])
    rr_mean = (pre_rr + post_rr) / 2.0

    pq_interval = _first_numeric_column(df, ["0_pq_interval", "pq_interval", "pr_interval", "1_pq_interval"])
    qrs_interval = _first_numeric_column(df, ["0_qrs_interval", "qrs_interval", "1_qrs_interval"])
    p_peak = _first_numeric_column(df, ["0_pPeak", "pPeak", "p_peak", "1_pPeak"]).abs()
    p_wave_presence = (p_peak > 0.02).astype(float)
    pr_seconds = pq_interval / sample_rate
    qrs_seconds = qrs_interval / sample_rate

    # Some beat-feature exports encode very small/zero fiducial intervals.
    # Replace those with conservative clinical defaults so training matches the
    # accepted API/UI feature range instead of learning impossible PR/QRS values.
    pr_seconds = pr_seconds.where(pr_seconds.between(0.04, 0.35), np.where(p_wave_presence >= 0.5, 0.16, 0.10))
    qrs_seconds = qrs_seconds.where(qrs_seconds.between(0.03, 0.25), 0.09)

    features = pd.DataFrame(index=df.index)
    features["heart_rate_bpm"] = (60.0 * sample_rate / rr_mean).replace([np.inf, -np.inf], np.nan)
    features["pr_interval_s"] = pr_seconds
    features["qrs_duration_s"] = qrs_seconds

    rr_variation = (pre_rr - post_rr).abs() / (rr_mean.abs() + 1e-6)
    features["rr_regularity"] = (rr_variation > 0.12).astype(float)
    features["p_wave_presence"] = p_wave_presence
    return clean_feature_frame(features)


def build_clinical_feature_frame(payload: dict | pd.DataFrame) -> pd.DataFrame:
    """Normalize manual clinical feature input into the model feature schema."""
    if isinstance(payload, dict):
        df = pd.DataFrame([payload])
    else:
        df = payload.copy()

    normalized = pd.DataFrame(index=df.index)
    normalized["heart_rate_bpm"] = _first_numeric_column(
        df, ["heart_rate_bpm", "heart_rate", "hr", "HR"]
    )
    normalized["pr_interval_s"] = _first_numeric_column(
        df, ["pr_interval_s", "pr_interval", "pr", "PR"]
    )
    normalized["qrs_duration_s"] = _first_numeric_column(
        df, ["qrs_duration_s", "qrs_duration", "qrs", "QRS"]
    )

    rr_source = _first_existing_column(df, ["rr_regularity", "rr_regular", "rhythm"])
    if rr_source is None:
        normalized["rr_regularity"] = np.nan
    else:
        normalized["rr_regularity"] = df[rr_source].apply(_rr_regularity_to_numeric)

    p_source = _first_existing_column(df, ["p_wave_presence", "p_wave_present", "p_wave", "pwave"])
    if p_source is None:
        normalized["p_wave_presence"] = np.nan
    else:
        normalized["p_wave_presence"] = df[p_source].apply(_bool_to_numeric)

    return clean_feature_frame(normalized)


def extract_features_from_any_csv(
    df: pd.DataFrame,
    sample_rate_hz: float | None = None,
) -> FeatureExtractionResult:
    """Extract model-ready features from supported uploaded CSV shapes."""
    messages: list[str] = []

    if _looks_like_clinical_feature_csv(df):
        features = build_clinical_feature_frame(df)
        source = "clinical_feature_csv"
    elif _looks_like_mit_bih_feature_csv(df):
        features = extract_features_from_beat_dataframe(df)
        source = "mit_bih_feature_csv"
    else:
        features, time_metadata = extract_features_from_timeseries_csv(df, sample_rate_hz)
        source = "digitized_timeseries_csv"
        messages.extend(time_metadata.pop("messages", []))

    original_rows = len(features)
    features = drop_invalid_feature_rows(features)
    dropped_rows = original_rows - len(features)
    if dropped_rows:
        messages.append(f"Dropped {dropped_rows} row(s) with missing or out-of-range feature values.")
    if features.empty:
        raise ValueError("No valid ECG feature rows could be extracted from the CSV.")

    metadata = {
        "rows_used": int(len(features)),
        "columns": list(df.columns),
    }
    if source == "digitized_timeseries_csv":
        metadata.update(time_metadata)

    return FeatureExtractionResult(features=features, source=source, messages=messages, metadata=metadata)


def extract_features_from_timeseries_csv(
    df: pd.DataFrame,
    sample_rate_hz: float | None = None,
) -> tuple[pd.DataFrame, dict]:
    """Estimate the 5 SVT features from a digitized ECG time-series CSV."""
    numeric_df = df.apply(pd.to_numeric, errors="coerce")
    time_col = _find_time_column(df)
    fs, fs_message = _resolve_timeseries_sample_rate(numeric_df, time_col, sample_rate_hz)

    lead_columns = [
        col
        for col in numeric_df.columns
        if col != time_col and numeric_df[col].notna().sum() >= max(10, len(numeric_df) // 10)
    ]
    if not lead_columns:
        raise ValueError("Timeseries CSV must include at least one numeric ECG lead column.")

    lead_col = max(lead_columns, key=lambda col: _signal_range(numeric_df[col].to_numpy(dtype=float)))
    signal = numeric_df[lead_col].to_numpy(dtype=float)
    signal = _interpolate_nan(signal)
    if len(signal) < max(50, int(fs * 1.0)):
        raise ValueError("Timeseries CSV is too short for rhythm analysis.")

    peaks, processed = _detect_r_peaks(signal, fs)
    if len(peaks) < 2:
        raise ValueError("Could not detect enough R peaks from the ECG timeseries.")

    rr_intervals = np.diff(peaks) / fs
    rr_intervals = rr_intervals[(rr_intervals >= 0.25) & (rr_intervals <= 2.5)]
    if len(rr_intervals) == 0:
        raise ValueError("Detected R peaks did not produce physiologic RR intervals.")

    heart_rate = float(60.0 / np.median(rr_intervals))
    rr_cv = float(np.std(rr_intervals) / (np.mean(rr_intervals) + 1e-6))
    qrs_duration = _estimate_qrs_duration(processed, peaks, fs)
    p_wave_present, pr_interval = _estimate_p_wave_and_pr(processed, peaks, fs)

    features = pd.DataFrame(
        [
            {
                "heart_rate_bpm": heart_rate,
                "pr_interval_s": pr_interval,
                "qrs_duration_s": qrs_duration,
                "rr_regularity": 1.0 if rr_cv > 0.12 else 0.0,
                "p_wave_presence": 1.0 if p_wave_present else 0.0,
            }
        ]
    )

    metadata = {
        "messages": [fs_message],
        "sample_rate_hz": float(fs),
        "selected_lead": str(lead_col),
        "detected_r_peaks": int(len(peaks)),
        "rr_cv": rr_cv,
    }
    return clean_feature_frame(features), metadata


def clean_feature_frame(features: pd.DataFrame) -> pd.DataFrame:
    """Return numeric features in model order."""
    cleaned = features.copy()
    for column in FEATURE_NAMES:
        if column not in cleaned.columns:
            cleaned[column] = np.nan
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")
    cleaned["rr_regularity"] = cleaned["rr_regularity"].clip(lower=0, upper=1)
    cleaned["p_wave_presence"] = cleaned["p_wave_presence"].clip(lower=0, upper=1)
    return cleaned[FEATURE_NAMES].replace([np.inf, -np.inf], np.nan)


def drop_invalid_feature_rows(features: pd.DataFrame) -> pd.DataFrame:
    """Filter features to the physiologic range accepted by the UI/API."""
    return features.loc[valid_feature_mask(features), FEATURE_NAMES].reset_index(drop=True)


def valid_feature_mask(features: pd.DataFrame) -> pd.Series:
    """Return the row mask used for training and upload filtering."""
    valid = features.notna().all(axis=1)
    valid &= features["heart_rate_bpm"].between(30, 240)
    valid &= features["pr_interval_s"].between(0.04, 0.35)
    valid &= features["qrs_duration_s"].between(0.03, 0.25)
    valid &= features["rr_regularity"].between(0, 1)
    valid &= features["p_wave_presence"].between(0, 1)
    return valid


def summarize_feature_predictions(
    features: pd.DataFrame,
    probabilities: np.ndarray,
    threshold: float,
    max_rows: int = 50,
) -> dict:
    """Aggregate beat/row predictions into one record-level SVT decision."""
    probabilities = np.asarray(probabilities, dtype=float)
    row_labels = np.where(probabilities >= threshold, "SVT", "Healthy")
    svt_count = int(np.sum(probabilities >= threshold))
    sample_count = int(len(probabilities))
    top_count = max(1, int(np.ceil(sample_count * 0.10)))
    top_probability_mean = float(np.mean(np.sort(probabilities)[-top_count:]))
    mean_probability = float(np.mean(probabilities))
    max_probability = float(np.max(probabilities))
    svt_fraction = float(svt_count / sample_count) if sample_count else 0.0

    record_label = "SVT" if top_probability_mean >= threshold or svt_fraction >= 0.05 else "Healthy"

    preview_rows = []
    for idx, (_, row) in enumerate(features.head(max_rows).iterrows()):
        preview = {name: float(row[name]) for name in FEATURE_NAMES}
        preview.update(
            {
                "row_index": idx,
                "label": str(row_labels[idx]),
                "svt_probability": float(probabilities[idx]),
            }
        )
        preview_rows.append(preview)

    mean_features = {
        "heart_rate_bpm": float(features["heart_rate_bpm"].mean()),
        "pr_interval_s": float(features["pr_interval_s"].mean()),
        "qrs_duration_s": float(features["qrs_duration_s"].mean()),
        "rr_regularity": "irregular" if features["rr_regularity"].mean() >= 0.5 else "regular",
        "p_wave_presence": bool(features["p_wave_presence"].mean() >= 0.5),
    }

    return {
        "record_label": record_label,
        "record_probability": top_probability_mean,
        "mean_probability": mean_probability,
        "max_probability": max_probability,
        "svt_count": svt_count,
        "sample_count": sample_count,
        "svt_fraction": svt_fraction,
        "mean_features": mean_features,
        "row_predictions": preview_rows,
    }


def load_training_dataset(paths: Iterable[str | Path]) -> tuple[pd.DataFrame, np.ndarray, list[dict]]:
    """Load and combine labeled training CSV files."""
    feature_frames = []
    targets = []
    summaries = []

    for path_value in paths:
        path = Path(path_value)
        df = load_csv(path)
        y = encode_svt_target(df)
        keep = y.notna()
        if not keep.any():
            raise ValueError(f"No supported Healthy/SVT labels found in {path}.")

        filtered = df.loc[keep].reset_index(drop=True)
        labels = y.loc[keep].astype(int).reset_index(drop=True)
        features = extract_features_from_beat_dataframe(filtered)
        valid = valid_feature_mask(features)
        valid_features = features.loc[valid, FEATURE_NAMES].reset_index(drop=True)
        labels = labels.loc[valid].to_numpy(dtype=int)

        feature_frames.append(valid_features)
        targets.append(labels)
        summaries.append(
            {
                "path": str(path),
                "rows_total": int(len(df)),
                "rows_labeled": int(keep.sum()),
                "rows_used": int(len(valid_features)),
                "healthy": int(np.sum(labels == 0)),
                "svt": int(np.sum(labels == 1)),
            }
        )

    X = pd.concat(feature_frames, ignore_index=True)
    y_all = np.concatenate(targets)
    if len(np.unique(y_all)) != 2:
        raise ValueError("Training data must contain both Healthy and SVT samples.")
    return X, y_all, summaries


def _first_existing_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    lookup = {str(col).lower(): col for col in df.columns}
    for candidate in candidates:
        if candidate in df.columns:
            return candidate
        match = lookup.get(candidate.lower())
        if match is not None:
            return match
    return None


def _first_numeric_column(df: pd.DataFrame, candidates: list[str]) -> pd.Series:
    column = _first_existing_column(df, candidates)
    if column is None:
        return pd.Series(np.nan, index=df.index, dtype=float)
    return pd.to_numeric(df[column], errors="coerce")


def _looks_like_clinical_feature_csv(df: pd.DataFrame) -> bool:
    return (
        _first_existing_column(df, ["heart_rate_bpm", "heart_rate", "hr"]) is not None
        and _first_existing_column(df, ["pr_interval_s", "pr_interval", "pr"]) is not None
        and _first_existing_column(df, ["qrs_duration_s", "qrs_duration", "qrs"]) is not None
    )


def _looks_like_mit_bih_feature_csv(df: pd.DataFrame) -> bool:
    required = ["0_pre-RR", "0_post-RR", "0_qrs_interval", "0_pq_interval"]
    return any(column in df.columns for column in required)


def _rr_regularity_to_numeric(value) -> float:
    if pd.isna(value):
        return np.nan
    if isinstance(value, (int, float, np.integer, np.floating)):
        return float(value)
    text = str(value).strip().lower()
    if text in {"irregular", "1", "true", "yes"}:
        return 1.0
    if text in {"regular", "0", "false", "no"}:
        return 0.0
    return np.nan


def _bool_to_numeric(value) -> float:
    if pd.isna(value):
        return np.nan
    if isinstance(value, (bool, np.bool_)):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float, np.integer, np.floating)):
        return 1.0 if float(value) >= 0.5 else 0.0
    text = str(value).strip().lower()
    if text in {"present", "true", "yes", "1"}:
        return 1.0
    if text in {"absent", "false", "no", "0"}:
        return 0.0
    return np.nan


def _find_time_column(df: pd.DataFrame) -> str | None:
    for column in df.columns:
        if str(column).strip().lower() in TIME_COLUMN_CANDIDATES:
            return column
    return None


def _resolve_timeseries_sample_rate(
    df: pd.DataFrame,
    time_col: str | None,
    requested_hz: float | None,
) -> tuple[float, str]:
    if requested_hz and requested_hz > 0:
        return float(requested_hz), f"Using requested sample rate: {float(requested_hz):.1f} Hz."

    if time_col is not None:
        time_values = df[time_col].dropna().to_numpy(dtype=float)
        if len(time_values) >= 3:
            diffs = np.diff(time_values)
            diffs = diffs[diffs > 0]
            if len(diffs):
                median_dt = float(np.median(diffs))
                if median_dt > 1.0:
                    return 1000.0 / median_dt, "Detected millisecond time axis from CSV."
                if median_dt > 0:
                    return 1.0 / median_dt, "Detected second-based time axis from CSV."

    return 500.0, "No sample-rate metadata found; using 500 Hz for digitized ECG CSV."


def _signal_range(values: np.ndarray) -> float:
    clean = values[np.isfinite(values)]
    if clean.size == 0:
        return 0.0
    return float(np.nanpercentile(clean, 95) - np.nanpercentile(clean, 5))


def _interpolate_nan(values: np.ndarray) -> np.ndarray:
    values = np.asarray(values, dtype=float)
    if np.isfinite(values).all():
        return values
    x = np.arange(len(values))
    good = np.isfinite(values)
    if good.sum() < 2:
        raise ValueError("ECG lead contains too few numeric samples.")
    return np.interp(x, x[good], values[good])


def _moving_average(values: np.ndarray, window: int) -> np.ndarray:
    window = max(1, int(window))
    if window == 1:
        return values
    kernel = np.ones(window, dtype=float) / window
    return np.convolve(values, kernel, mode="same")


def _detect_r_peaks(signal: np.ndarray, fs: float) -> tuple[np.ndarray, np.ndarray]:
    centered = signal - np.median(signal)
    scale = np.percentile(np.abs(centered), 95)
    if not np.isfinite(scale) or scale <= 0:
        scale = np.std(centered) + 1e-6
    processed = centered / (scale + 1e-6)
    processed = _moving_average(processed, max(1, int(fs * 0.015)))
    if abs(np.nanmin(processed)) > abs(np.nanmax(processed)):
        processed = -processed

    min_distance = max(1, int(fs * 0.25))
    selected = np.array([], dtype=int)
    for quantile in [98, 95, 90, 85, 80]:
        threshold = max(0.20, float(np.percentile(processed, quantile)))
        candidates = np.where(
            (processed[1:-1] > processed[:-2])
            & (processed[1:-1] >= processed[2:])
            & (processed[1:-1] >= threshold)
        )[0] + 1
        selected = _non_max_suppression_1d(candidates, processed, min_distance)
        if len(selected) >= 2:
            break
    return selected, processed


def _non_max_suppression_1d(candidates: np.ndarray, signal: np.ndarray, min_distance: int) -> np.ndarray:
    if len(candidates) == 0:
        return candidates
    ordered = sorted(candidates, key=lambda idx: signal[idx], reverse=True)
    selected: list[int] = []
    for idx in ordered:
        if all(abs(idx - kept) >= min_distance for kept in selected):
            selected.append(int(idx))
    return np.array(sorted(selected), dtype=int)


def _estimate_qrs_duration(processed: np.ndarray, peaks: np.ndarray, fs: float) -> float:
    durations = []
    max_width = int(0.18 * fs)
    for peak in peaks[: min(len(peaks), 20)]:
        window_start = max(0, peak - max_width)
        window_end = min(len(processed), peak + max_width)
        baseline = float(np.median(processed[window_start:window_end]))
        amplitude = float(processed[peak] - baseline)
        if amplitude <= 0:
            continue
        threshold = baseline + amplitude * 0.35
        left = peak
        while left > window_start and processed[left] > threshold:
            left -= 1
        right = peak
        while right < window_end - 1 and processed[right] > threshold:
            right += 1
        duration = (right - left) / fs
        if 0.03 <= duration <= 0.20:
            durations.append(duration)
    if not durations:
        return 0.09
    return float(np.clip(np.median(durations), 0.04, 0.18))


def _estimate_p_wave_and_pr(processed: np.ndarray, peaks: np.ndarray, fs: float) -> tuple[bool, float]:
    pr_values = []
    p_hits = 0
    for peak in peaks[: min(len(peaks), 20)]:
        start = max(0, peak - int(0.25 * fs))
        end = max(0, peak - int(0.08 * fs))
        if end <= start + 2:
            continue
        segment = processed[start:end]
        local_idx = int(np.argmax(segment))
        p_idx = start + local_idx
        p_amp = float(segment[local_idx] - np.median(segment))
        r_amp = float(processed[peak] - np.median(segment))
        if r_amp > 0 and p_amp > max(0.08, 0.08 * r_amp):
            pr = (peak - p_idx) / fs
            if 0.08 <= pr <= 0.24:
                p_hits += 1
                pr_values.append(pr)

    if pr_values:
        return p_hits >= max(1, len(peaks[:20]) * 0.25), float(np.median(pr_values))
    return False, 0.10
