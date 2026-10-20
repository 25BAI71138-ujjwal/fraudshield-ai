"""
FraudShield AI - Dataset Generator & Loader
Generates a realistic, reproducible synthetic digital payments / UPI fraud dataset
mimicking real-world financial transaction distributions and behavioral anomalies.
"""

import os
import numpy as np
import pandas as pd

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

DATASET_METADATA = {
    "source": "FraudShield AI Synthetic Digital Payments Engine (v1.0)",
    "mode": "synthetic-demonstration",
    "description": "Simulated multi-channel digital payment (UPI / Card / NetBanking) transaction dataset reflecting real-world fraud indicators, velocity spikes, and credential anomalies.",
    "features": {
        "amount": "Transaction amount in fiat currency (INR/USD equivalent)",
        "transaction_hour": "Hour of the day when transaction was initiated (0 - 23)",
        "transaction_frequency_24h": "Number of transactions completed by the user in the past 24 hours",
        "failed_attempts_24h": "Number of incorrect PIN/password/OTP attempts in the past 24 hours",
        "is_new_device": "Binary indicator (1 if device footprint is novel, 0 if recognized)",
        "is_new_beneficiary": "Binary indicator (1 if recipient VPA/account is newly added)",
        "amount_deviation_score": "Ratio of current transaction amount to historical 30-day average spending (1.0 = normal)",
        "location_risk_score": "Heuristic IP/geo-anomaly score from 0.0 (safe home zone) to 1.0 (distant high-risk IP)"
    },
    "limitations": [
        "Synthetic transaction distribution modeled on retail digital payment patterns.",
        "Demonstration purposes only; does not contain real PII or live banking data.",
        "Ground truth labels reflect simulated fraud rules combined with probabilistic noise."
    ]
}


def generate_synthetic_dataset(n_samples: int = 8000, fraud_ratio: float = 0.05, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic transaction dataset with genuine transactions and injected fraud patterns.
    """
    np.random.seed(random_state)
    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    # --- Legitimate Transactions ---
    # Log-normal amounts centered around $45 (log ~ 3.8)
    legit_amount = np.random.lognormal(mean=3.8, sigma=0.9, size=n_legit)
    legit_amount = np.clip(legit_amount, 5.0, 1500.0).round(2)

    # Typical daily transaction hours (peak morning to evening 8 AM - 10 PM)
    p_legit_hours = np.array([
        0.01, 0.005, 0.005, 0.005, 0.01, 0.02, 0.04, 0.06, 0.08, 0.08, 0.07, 0.07,
        0.07, 0.06, 0.06, 0.06, 0.07, 0.08, 0.07, 0.06, 0.04, 0.03, 0.015, 0.01
    ])
    p_legit_hours = p_legit_hours / p_legit_hours.sum()
    legit_hours = np.random.choice(np.arange(24), size=n_legit, p=p_legit_hours)

    legit_frequency = np.random.poisson(lam=2.5, size=n_legit)
    legit_frequency = np.clip(legit_frequency, 1, 15)

    p_legit_failed = np.array([0.92, 0.07, 0.01])
    p_legit_failed = p_legit_failed / p_legit_failed.sum()
    legit_failed = np.random.choice([0, 1, 2], size=n_legit, p=p_legit_failed)

    p_legit_device = np.array([0.88, 0.12])
    p_legit_device = p_legit_device / p_legit_device.sum()
    legit_new_device = np.random.choice([0, 1], size=n_legit, p=p_legit_device)

    p_legit_bene = np.array([0.80, 0.20])
    p_legit_bene = p_legit_bene / p_legit_bene.sum()
    legit_new_beneficiary = np.random.choice([0, 1], size=n_legit, p=p_legit_bene)

    legit_deviation = np.random.gamma(shape=2.0, scale=0.5, size=n_legit).round(2)
    legit_deviation = np.clip(legit_deviation, 0.2, 3.5)

    legit_loc_risk = np.random.beta(a=1, b=8, size=n_legit).round(2)

    df_legit = pd.DataFrame({
        "amount": legit_amount,
        "transaction_hour": legit_hours,
        "transaction_frequency_24h": legit_frequency,
        "failed_attempts_24h": legit_failed,
        "is_new_device": legit_new_device,
        "is_new_beneficiary": legit_new_beneficiary,
        "amount_deviation_score": legit_deviation,
        "location_risk_score": legit_loc_risk,
        "is_fraud": 0
    })

    # --- Fraudulent Transactions ---
    # High amount spikes, account takeovers, brute force, velocity storms
    fraud_amount = np.random.lognormal(mean=6.5, sigma=1.2, size=n_fraud)
    fraud_amount = np.clip(fraud_amount, 80.0, 15000.0).round(2)

    # Late night hours (11 PM - 4 AM) or irregular bursts
    p_fraud_hours = np.array([
        0.09, 0.11, 0.12, 0.10, 0.08, 0.04, 0.03, 0.02, 0.02, 0.02, 0.03, 0.03,
        0.03, 0.03, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.03, 0.03, 0.04, 0.06
    ])
    p_fraud_hours = p_fraud_hours / p_fraud_hours.sum()
    fraud_hours = np.random.choice(np.arange(24), size=n_fraud, p=p_fraud_hours)

    # Velocity attacks (many rapid transactions in 24h)
    fraud_frequency = np.random.poisson(lam=9.0, size=n_fraud)
    fraud_frequency = np.clip(fraud_frequency, 2, 45)

    # Multiple failed attempts (PIN guesses, OTP fatigue attacks)
    p_fraud_failed = np.array([0.15, 0.20, 0.25, 0.20, 0.12, 0.08])
    p_fraud_failed = p_fraud_failed / p_fraud_failed.sum()
    fraud_failed = np.random.choice([0, 1, 2, 3, 4, 5], size=n_fraud, p=p_fraud_failed)

    # High correlation with new devices and newly added beneficiaries
    p_fraud_device = np.array([0.25, 0.75])
    p_fraud_device = p_fraud_device / p_fraud_device.sum()
    fraud_new_device = np.random.choice([0, 1], size=n_fraud, p=p_fraud_device)

    p_fraud_bene = np.array([0.20, 0.80])
    p_fraud_bene = p_fraud_bene / p_fraud_bene.sum()
    fraud_new_beneficiary = np.random.choice([0, 1], size=n_fraud, p=p_fraud_bene)

    # Unusually large deviation from user's standard spending
    fraud_deviation = np.random.gamma(shape=5.0, scale=1.5, size=n_fraud).round(2)
    fraud_deviation = np.clip(fraud_deviation, 1.8, 25.0)

    # Anomaly in location / IP proxy / VPN
    fraud_loc_risk = np.random.beta(a=5, b=2, size=n_fraud).round(2)

    df_fraud = pd.DataFrame({
        "amount": fraud_amount,
        "transaction_hour": fraud_hours,
        "transaction_frequency_24h": fraud_frequency,
        "failed_attempts_24h": fraud_failed,
        "is_new_device": fraud_new_device,
        "is_new_beneficiary": fraud_new_beneficiary,
        "amount_deviation_score": fraud_deviation,
        "location_risk_score": fraud_loc_risk,
        "is_fraud": 1
    })

    # Combine
    df = pd.concat([df_legit, df_fraud], ignore_index=True)

    # Inject realistic overlapping noise and borderline cases:
    # Some legit users buy expensive items from a new device (looks suspicious, but legit)
    # Some fraudsters perform micro-amounts to test cards
    # Small label uncertainty to reflect human review variance (1.5% label noise)
    flip_indices = np.random.choice(len(df), size=int(0.015 * len(df)), replace=False)
    for idx in flip_indices:
        df.loc[idx, "is_fraud"] = 1 - df.loc[idx, "is_fraud"]

    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df


def ensure_dataset(data_path: str = None) -> str:
    """
    Ensures the training dataset exists on disk; creates it if missing.
    """
    if data_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_path = os.path.join(base_dir, "data", "transactions_train.csv")

    os.makedirs(os.path.dirname(data_path), exist_ok=True)
    if not os.path.exists(data_path):
        print(f"Generating synthetic transaction dataset -> {data_path}")
        df = generate_synthetic_dataset(n_samples=10000, fraud_ratio=0.048, random_state=42)
        df.to_csv(data_path, index=False)
        print(f"Dataset generated with {len(df)} records ({df['is_fraud'].sum()} fraudulent).")
    return data_path


if __name__ == "__main__":
    path = ensure_dataset()
    df = pd.read_csv(path)
    print(f"Dataset preview:\n{df.head()}")
    print(f"\nFraud distribution:\n{df['is_fraud'].value_counts(normalize=True)}")
