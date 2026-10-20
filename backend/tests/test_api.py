import os
import sys
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database.db import init_db

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["model_loaded"] is True
    assert data["system"] == "Dhanrakshak AI"


def test_model_metrics_endpoint():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "evaluation_metrics" in data
    assert "confusion_matrix" in data
    assert "feature_importances" in data
    assert data["evaluation_metrics"]["precision"] > 0.70


def test_predict_normal_transaction():
    payload = {
        "amount": 25.50,
        "transaction_hour": 14,
        "transaction_frequency_24h": 2,
        "failed_attempts_24h": 0,
        "is_new_device": 0,
        "is_new_beneficiary": 0,
        "amount_deviation_score": 0.9,
        "location_risk_score": 0.05,
        "payment_method": "UPI",
        "merchant_category": "Grocery"
    }
    response = client.post("/api/transactions/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "transaction_id" in data
    assert 0 <= data["risk_score"] <= 100
    assert data["decision"] in ["APPROVE", "VERIFY", "BLOCK"]
    assert isinstance(data["reasons"], list)
    assert len(data["reasons"]) > 0
    assert data["inference_time_ms"] > 0


def test_predict_high_risk_transaction():
    payload = {
        "amount": 8500.00,
        "transaction_hour": 3,
        "transaction_frequency_24h": 25,
        "failed_attempts_24h": 4,
        "is_new_device": 1,
        "is_new_beneficiary": 1,
        "amount_deviation_score": 12.0,
        "location_risk_score": 0.95,
        "payment_method": "NET_BANKING",
        "merchant_category": "Transfer"
    }
    response = client.post("/api/transactions/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    # High risk should trigger BLOCK or VERIFY with high risk score
    assert data["risk_score"] >= 50
    assert data["decision"] in ["BLOCK", "VERIFY"]


def test_input_validation_negative_amount():
    payload = {
        "amount": -50.00,
        "transaction_hour": 14,
        "transaction_frequency_24h": 2,
        "failed_attempts_24h": 0,
        "is_new_device": 0,
        "is_new_beneficiary": 0,
        "amount_deviation_score": 1.0,
        "location_risk_score": 0.0
    }
    response = client.post("/api/transactions/predict", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_input_validation_invalid_hour():
    payload = {
        "amount": 100.00,
        "transaction_hour": 28,  # invalid hour
        "transaction_frequency_24h": 2,
        "failed_attempts_24h": 0,
        "is_new_device": 0,
        "is_new_beneficiary": 0,
        "amount_deviation_score": 1.0,
        "location_risk_score": 0.0
    }
    response = client.post("/api/transactions/predict", json=payload)
    assert response.status_code == 422


def test_demo_seed_and_dashboard_summary():
    # Seed 15 demo transactions
    seed_res = client.post("/api/demo/seed?count=15")
    assert seed_res.status_code == 200
    assert seed_res.json()["count"] == 15

    # Check dashboard summary
    summary_res = client.get("/api/dashboard/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_transactions"] >= 15
    assert summary["total_volume"] > 0
    assert "APPROVE" in summary["decision_distribution"]


def test_transactions_pagination_and_filter():
    response = client.get("/api/transactions?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 10
    assert len(data["transactions"]) <= 10
    assert data["total"] >= len(data["transactions"])


def test_csv_export():
    response = client.get("/api/transactions/export")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Transaction ID" in response.text


def test_settings_threshold_update():
    # Get current settings
    curr = client.get("/api/settings").json()
    assert "approve_threshold" in curr

    # Update thresholds
    new_payload = {"approve_threshold": 25, "verify_threshold": 65}
    up_res = client.post("/api/settings", json=new_payload)
    assert up_res.status_code == 200
    assert up_res.json()["approve_threshold"] == 25
    assert up_res.json()["verify_threshold"] == 65

    # Restore default
    client.post("/api/settings", json={"approve_threshold": 30, "verify_threshold": 70})


def test_gemini_chat_endpoint():
    response = client.post("/api/chat", json={
        "message": "Explain what FraudShield AI is in 10 words."
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["success", "error"]
    assert "reply" in data
    assert len(data["reply"]) > 0


def test_fraud_intel_news_endpoint():
    response = client.get("/api/news/fraud-intel")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["count"] > 0
    assert len(data["articles"]) > 0
    first_item = data["articles"][0]
    assert "title" in first_item
    assert "category" in first_item
    assert "fraud_shield_vector" in first_item

