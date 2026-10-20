"""
FraudShield AI - Real-Time Inference & Explainability Engine
Loads saved model artifacts, scores incoming transactions,
and derives transparent human-readable explanations.
"""

import os
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

FEATURE_COLUMNS = [
    "amount",
    "transaction_hour",
    "transaction_frequency_24h",
    "failed_attempts_24h",
    "is_new_device",
    "is_new_beneficiary",
    "amount_deviation_score",
    "location_risk_score"
]


class FraudPredictor:
    def __init__(self, artifacts_dir: str = None):
        if artifacts_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            artifacts_dir = os.path.join(base_dir, "artifacts")

        self.artifacts_dir = artifacts_dir
        self.model = None
        self.scaler = None
        self._load_artifacts()

    def _load_artifacts(self):
        model_path = os.path.join(self.artifacts_dir, "model.joblib")
        scaler_path = os.path.join(self.artifacts_dir, "scaler.joblib")

        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            raise FileNotFoundError(
                f"Model artifacts not found in {self.artifacts_dir}. Run `train.py` first."
            )

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        if hasattr(self.model, "n_jobs"):
            self.model.n_jobs = 1

    def is_ready(self) -> bool:
        return self.model is not None and self.scaler is not None

    def explain_prediction(self, data: Dict[str, Any], fraud_prob: float) -> List[str]:
        """
        Generates understandable reason codes explaining why a transaction
        was flagged or approved.
        """
        reasons = []

        amount = float(data.get("amount", 0.0))
        hour = int(data.get("transaction_hour", 12))
        freq = int(data.get("transaction_frequency_24h", 1))
        failed = int(data.get("failed_attempts_24h", 0))
        new_device = int(data.get("is_new_device", 0)) == 1
        new_beneficiary = int(data.get("is_new_beneficiary", 0)) == 1
        deviation = float(data.get("amount_deviation_score", 1.0))
        loc_risk = float(data.get("location_risk_score", 0.0))

        # Spending anomaly
        if deviation >= 4.0:
            reasons.append(f"Spending surge: Amount is {deviation:.1f}x higher than user's 30-day baseline.")
        elif deviation >= 2.5:
            reasons.append(f"Moderate amount anomaly: {deviation:.1f}x above average transaction size.")

        # Large absolute payment
        if amount >= 5000:
            reasons.append(f"High-value transfer alert: ${amount:,.2f} exceeds standard retail safety tier.")

        # Account takeover pattern (New Device + New Beneficiary)
        if new_device and new_beneficiary:
            reasons.append("Account Takeover risk: First-time device paired with an unverified new recipient.")
        elif new_device:
            reasons.append("Unrecognized device fingerprint detected.")
        elif new_beneficiary and amount > 1000:
            reasons.append("High-value payment to a newly added beneficiary.")

        # Failed attempts / Brute force
        if failed >= 3:
            reasons.append(f"Authentication anomaly: {failed} failed verification attempts in past 24 hours.")
        elif failed >= 1 and fraud_prob > 0.4:
            reasons.append(f"Recent PIN/credential failure recorded ({failed} failure).")

        # Velocity attack
        if freq >= 15:
            reasons.append(f"Velocity spike: Extreme frequency of {freq} transactions in 24 hours.")
        elif freq >= 8:
            reasons.append(f"Elevated velocity: {freq} transactions completed in past 24 hours.")

        # Non-standard hours
        if hour in [1, 2, 3, 4] and (deviation > 2.0 or new_device or failed > 0):
            reasons.append(f"Irregular transaction hour: Initiated at {hour:02d}:00 (off-peak alert).")

        # Geolocation risk
        if loc_risk >= 0.7:
            reasons.append(f"Location anomaly: High-risk network/IP geofence score ({loc_risk:.2f}).")

        # If model marked high probability but heuristics were subtle
        if fraud_prob >= 0.70 and not reasons:
            reasons.append("Complex multi-feature statistical anomaly flagged by Random Forest ensemble.")

        # Approved / Safe reasons
        if not reasons:
            reasons.append("Normal spending pattern matching established user baseline and trusted device.")

        return reasons

    def predict(
        self,
        features: Dict[str, Any],
        approve_threshold: float = 30.0,
        verify_threshold: float = 70.0
    ) -> Dict[str, Any]:
        """
        Runs model inference and outputs risk score, decision, reasons, and latency.
        """
        t0 = time.perf_counter()

        # Build feature vector
        vector = []
        for col in FEATURE_COLUMNS:
            val = features.get(col, 0)
            vector.append(float(val))

        X_input = pd.DataFrame([vector], columns=FEATURE_COLUMNS)
        X_scaled = self.scaler.transform(X_input)

        # Predict probability
        probs = self.model.predict_proba(X_scaled)[0]
        # class 1 = fraud
        fraud_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])

        # Composite risk score (0 - 100)
        risk_score = int(round(fraud_prob * 100))
        risk_score = max(0, min(100, risk_score))

        # Risk level and policy decision
        if risk_score < approve_threshold:
            decision = "APPROVE"
            risk_level = "LOW"
        elif risk_score < verify_threshold:
            decision = "VERIFY"
            risk_level = "MEDIUM"
        else:
            decision = "BLOCK"
            risk_level = "HIGH"

        reasons = self.explain_prediction(features, fraud_prob)

        t1 = time.perf_counter()
        latency_ms = round((t1 - t0) * 1000.0, 2)

        return {
            "fraud_probability": round(fraud_prob, 4),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "decision": decision,
            "reasons": reasons,
            "inference_time_ms": latency_ms,
            "model_version": "1.2.0"
        }


# Global singleton instance
_predictor_instance = None


def get_predictor() -> FraudPredictor:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = FraudPredictor()
    return _predictor_instance
