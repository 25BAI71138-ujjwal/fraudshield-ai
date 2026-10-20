"""
FraudShield AI - Model Training Pipeline
Trains a high-performance machine learning model with stratified validation,
class imbalance handling, and comprehensive evaluation metrics.
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score,
    confusion_matrix, classification_report
)

from dataset import ensure_dataset, FEATURE_COLUMNS, DATASET_METADATA


def train_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    artifacts_dir = os.path.join(base_dir, "ml", "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    # 1. Load and validate dataset
    dataset_path = ensure_dataset()
    df = pd.read_csv(dataset_path)

    # Validation
    missing_cols = set(FEATURE_COLUMNS + ["is_fraud"]) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required columns in dataset: {missing_cols}")

    if df[FEATURE_COLUMNS].isnull().any().any():
        df = df.dropna(subset=FEATURE_COLUMNS + ["is_fraud"])

    X = df[FEATURE_COLUMNS]
    y = df["is_fraud"].astype(int)

    total_samples = len(df)
    fraud_samples = int(y.sum())
    legit_samples = total_samples - fraud_samples
    fraud_rate = fraud_samples / total_samples

    print(f"Loaded {total_samples} transactions ({fraud_samples} fraud, {fraud_rate*100:.2f}%).")

    # 2. Stratified train/test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 3. Fit Preprocessing
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train Models
    print("Training Random Forest Classifier (balanced weights)...")
    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=10,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_scaled, y_train)
    # Single-row inference avoids the worker-pool overhead of parallel prediction.
    rf_model.n_jobs = 1

    print("Training Logistic Regression baseline...")
    lr_model = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    lr_model.fit(X_train_scaled, y_train)

    # 5. Evaluate on Held-out Test Data
    y_pred = rf_model.predict(X_test_scaled)
    y_prob = rf_model.predict_proba(X_test_scaled)[:, 1]

    # Baseline predictions
    lr_pred = lr_model.predict(X_test_scaled)
    lr_prob = lr_model.predict_proba(X_test_scaled)[:, 1]

    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    pr_auc = float(average_precision_score(y_test, y_prob))

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    # Baseline comparison metrics
    lr_metrics = {
        "precision": float(precision_score(y_test, lr_pred)),
        "recall": float(recall_score(y_test, lr_pred)),
        "f1": float(f1_score(y_test, lr_pred)),
        "roc_auc": float(roc_auc_score(y_test, lr_prob)),
        "pr_auc": float(average_precision_score(y_test, lr_prob))
    }

    # Measure real inference latency across 300 test samples
    latencies = []
    sample_for_bench = X_test_scaled[:300]
    for i in range(len(sample_for_bench)):
        single_row = sample_for_bench[i:i+1]
        t0 = time.perf_counter()
        _ = rf_model.predict_proba(single_row)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)

    avg_latency_ms = float(np.mean(latencies))
    p95_latency_ms = float(np.percentile(latencies, 95))

    # Feature importances
    feature_importances = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(
            zip(FEATURE_COLUMNS, rf_model.feature_importances_),
            key=lambda x: x[1],
            reverse=True
        )
    ]

    # Metrics payload
    metrics_payload = {
        "model_name": "FraudShield Random Forest Risk Engine",
        "model_type": "RandomForestClassifier",
        "version": "1.2.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_metadata": DATASET_METADATA,
        "dataset_stats": {
            "total_samples": total_samples,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "fraud_samples": fraud_samples,
            "legitimate_samples": legit_samples,
            "fraud_rate_pct": round(fraud_rate * 100, 2)
        },
        "evaluation_metrics": {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "false_positive_rate": round(fpr, 4),
            "false_negative_rate": round(fnr, 4),
            "avg_inference_latency_ms": round(avg_latency_ms, 2),
            "p95_inference_latency_ms": round(p95_latency_ms, 2)
        },
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
            "total_test": len(y_test)
        },
        "baseline_comparison": {
            "model": "LogisticRegression (balanced)",
            "metrics": {k: round(v, 4) for k, v in lr_metrics.items()}
        },
        "feature_importances": feature_importances,
        "feature_columns": FEATURE_COLUMNS
    }

    # 6. Save artifacts
    model_path = os.path.join(artifacts_dir, "model.joblib")
    scaler_path = os.path.join(artifacts_dir, "scaler.joblib")
    metrics_path = os.path.join(artifacts_dir, "metrics.json")
    dataset_info_path = os.path.join(artifacts_dir, "dataset_info.json")

    joblib.dump(rf_model, model_path)
    joblib.dump(scaler, scaler_path)

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    with open(dataset_info_path, "w", encoding="utf-8") as f:
        json.dump(DATASET_METADATA, f, indent=2)

    print("--- Model Training Complete ---")
    print(f"Saved artifacts to {artifacts_dir}")
    print(f"Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f} | ROC-AUC: {roc_auc:.4f}")
    print(f"Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print(f"Inference Latency: avg={avg_latency_ms:.2f}ms, p95={p95_latency_ms:.2f}ms")
    return metrics_payload


if __name__ == "__main__":
    train_model()
