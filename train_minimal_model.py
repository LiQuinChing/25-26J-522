"""Train the SVT detection model used by the Flask API.

Example:
  python train_minimal_model.py --data good_ecg.csv "C:\\path\\MIT-BIH Supraventricular Arrhythmia Database.csv"
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from svt_pipeline import FEATURE_NAMES, load_training_dataset


DEFAULT_MODEL_PATH = Path("models/svt_minimal_model.joblib")
DEFAULT_REPORT_PATH = Path("models/svt_training_report.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train SVT classifier from labeled ECG feature CSV files.")
    parser.add_argument(
        "--data",
        nargs="+",
        default=["good_ecg.csv"],
        help="One or more labeled CSV files. Each file must include a 'type' label column.",
    )
    parser.add_argument("--model-out", default=str(DEFAULT_MODEL_PATH), help="Output .joblib model path.")
    parser.add_argument("--report-out", default=str(DEFAULT_REPORT_PATH), help="Output training report JSON path.")
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--n-jobs", type=int, default=1, help="Parallel jobs for RandomForest. Use 1 on restricted Windows shells.")
    return parser.parse_args()


def choose_threshold(y_true: np.ndarray, probabilities: np.ndarray) -> tuple[float, dict]:
    """Choose a screening-friendly threshold from validation predictions."""
    best = None
    for threshold in np.linspace(0.05, 0.80, 151):
        preds = (probabilities >= threshold).astype(int)
        recall = recall_score(y_true, preds, zero_division=0)
        precision = precision_score(y_true, preds, zero_division=0)
        f1 = f1_score(y_true, preds, zero_division=0)
        candidate = {
            "threshold": float(threshold),
            "recall": float(recall),
            "precision": float(precision),
            "f1": float(f1),
        }
        if recall >= 0.90:
            if best is None or candidate["f1"] > best["f1"]:
                best = candidate

    if best is None:
        for threshold in np.linspace(0.05, 0.80, 151):
            preds = (probabilities >= threshold).astype(int)
            candidate = {
                "threshold": float(threshold),
                "recall": float(recall_score(y_true, preds, zero_division=0)),
                "precision": float(precision_score(y_true, preds, zero_division=0)),
                "f1": float(f1_score(y_true, preds, zero_division=0)),
            }
            if best is None or candidate["f1"] > best["f1"]:
                best = candidate

    assert best is not None
    return float(best["threshold"]), best


def evaluate_split(name: str, y_true: np.ndarray, probabilities: np.ndarray, threshold: float) -> dict:
    preds = (probabilities >= threshold).astype(int)
    report = classification_report(
        y_true,
        preds,
        target_names=["Healthy", "SVT"],
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_true, preds)
    return {
        "name": name,
        "roc_auc": float(roc_auc_score(y_true, probabilities)),
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
    }


def main() -> None:
    args = parse_args()
    model_path = Path(args.model_out)
    report_path = Path(args.report_out)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("Training SVT Detection Model")
    print("=" * 70)
    print("Datasets:")
    for path in args.data:
        print(f"  - {path}")

    X, y, dataset_summaries = load_training_dataset(args.data)
    print(f"\nRows used: {len(X):,}")
    print(f"Healthy: {int(np.sum(y == 0)):,}")
    print(f"SVT: {int(np.sum(y == 1)):,}")

    X_train, X_holdout, y_train, y_holdout = train_test_split(
        X,
        y,
        test_size=0.30,
        random_state=args.random_state,
        stratify=y,
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_holdout,
        y_holdout,
        test_size=0.50,
        random_state=args.random_state,
        stratify=y_holdout,
    )

    model = RandomForestClassifier(
        n_estimators=350,
        max_depth=14,
        min_samples_split=8,
        min_samples_leaf=3,
        class_weight="balanced_subsample",
        n_jobs=args.n_jobs,
        random_state=args.random_state,
    )

    print("\nTraining Random Forest...")
    model.fit(X_train, y_train)

    val_proba = model.predict_proba(X_val)[:, 1]
    threshold, threshold_metrics = choose_threshold(y_val, val_proba)
    test_proba = model.predict_proba(X_test)[:, 1]

    validation_metrics = evaluate_split("validation", y_val, val_proba, threshold)
    test_metrics = evaluate_split("test", y_test, test_proba, threshold)

    print("\nDecision threshold:")
    print(
        f"  {threshold:.3f} "
        f"(validation recall={threshold_metrics['recall']:.3f}, "
        f"precision={threshold_metrics['precision']:.3f}, "
        f"F1={threshold_metrics['f1']:.3f})"
    )
    print("\nTest classification report:")
    print(
        classification_report(
            y_test,
            (test_proba >= threshold).astype(int),
            target_names=["Healthy", "SVT"],
            zero_division=0,
        )
    )
    print("Test confusion matrix:")
    print(confusion_matrix(y_test, (test_proba >= threshold).astype(int)))
    print(f"Test ROC AUC: {test_metrics['roc_auc']:.4f}")

    importances = {
        name: float(value)
        for name, value in sorted(
            zip(FEATURE_NAMES, model.feature_importances_),
            key=lambda item: item[1],
            reverse=True,
        )
    }
    print("\nFeature importances:")
    for name, value in importances.items():
        print(f"  {name:20s}: {value:.4f}")

    bundle = {
        "model": model,
        "feature_names": FEATURE_NAMES,
        "threshold": threshold,
        "class_names": ["Healthy", "SVT"],
        "metadata": {
            "trained_at": datetime.now().isoformat(timespec="seconds"),
            "datasets": dataset_summaries,
            "threshold_selection": threshold_metrics,
            "feature_importances": importances,
        },
    }
    joblib.dump(bundle, model_path)

    report = {
        "model_path": str(model_path),
        "feature_names": FEATURE_NAMES,
        "dataset_summaries": dataset_summaries,
        "threshold": threshold,
        "threshold_selection": threshold_metrics,
        "validation": validation_metrics,
        "test": test_metrics,
        "feature_importances": importances,
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"\nModel saved to: {model_path}")
    print(f"Training report saved to: {report_path}")
    print("=" * 70)
    print("Training complete")
    print("=" * 70)


if __name__ == "__main__":
    main()
