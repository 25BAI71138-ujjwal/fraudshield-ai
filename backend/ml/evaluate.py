"""
FraudShield AI - Standalone Model Evaluation Script
Loads held-out test data and saved model artifacts to generate
detailed classification reports, ROC metrics, and confusion matrix tables.
"""

import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, average_precision_score
from dataset import FEATURE_COLUMNS, ensure_dataset


def run_evaluation():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    artifacts_dir = os.path.join(base_dir, "ml", "artifacts")

    model_path = os.path.join(artifacts_dir, "model.joblib")
    scaler_path = os.path.join(artifacts_dir, "scaler.joblib")

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        print("Artifacts missing. Running train.py...")
        from train import train_model
        train_model()

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    data_path = ensure_dataset()
    df = pd.read_csv(data_path)

    X = df[FEATURE_COLUMNS]
    y = df["is_fraud"].astype(int)

    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    print("\n================== FRAUDSHIELD AI EVALUATION REPORT ==================")
    print(classification_report(y_test, y_pred, target_names=["Legitimate (0)", "Fraud (1)"]))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")
    print(f"PR-AUC (Avg Precision): {average_precision_score(y_test, y_prob):.4f}")
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  TN: {cm[0, 0]} | FP: {cm[0, 1]}")
    print(f"  FN: {cm[1, 0]} | TP: {cm[1, 1]}")
    print("======================================================================\n")


if __name__ == "__main__":
    run_evaluation()
