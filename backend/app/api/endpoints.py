import json
import os
from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional

from app.schemas.transaction import (
    TransactionCreate, TransactionResponse, PaginatedTransactions,
    DashboardSummary, SettingsPayload, VerificationAction,
    ChatRequest, ChatResponse
)
from app.services.transaction_service import (
    create_transaction, list_transactions, get_transaction_by_id,
    update_verification_status, get_dashboard_summary, get_analytics_data,
    seed_demo_data, reset_transactions, export_transactions_csv
)
from app.services.chat_service import generate_chat_response
from app.services.news_service import fetch_live_news
from app.database.db import get_thresholds, set_thresholds
from app.core.config import settings
from ml.predict import get_predictor

router = APIRouter()


@router.get("/health")
def health_check():
    predictor_ready = False
    try:
        predictor = get_predictor()
        predictor_ready = predictor.is_ready()
    except Exception:
        predictor_ready = False

    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_loaded": predictor_ready,
        "database": "sqlite_connected"
    }


@router.post("/transactions/predict", response_model=TransactionResponse)
def predict_transaction(payload: TransactionCreate):
    try:
        return create_transaction(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.get("/transactions", response_model=PaginatedTransactions)
def get_transactions(
    decision: Optional[str] = Query(None, description="Filter: APPROVE, VERIFY, BLOCK, or ALL"),
    risk_level: Optional[str] = Query(None, description="Filter: LOW, MEDIUM, HIGH, or ALL"),
    search: Optional[str] = Query(None, description="Search query by ID or category"),
    date: Optional[str] = Query(None, description="Date filter YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    total, items = list_transactions(
        decision=decision,
        risk_level=risk_level,
        search=search,
        date_filter=date,
        page=page,
        limit=limit
    )
    return PaginatedTransactions(
        total=total,
        page=page,
        limit=limit,
        transactions=items
    )


@router.get("/transactions/export")
def export_csv(
    decision: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    csv_content = export_transactions_csv(decision=decision, risk_level=risk_level, search=search)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dhanrakshak_transactions.csv"}
    )


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: str):
    txn = get_transaction_by_id(transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.post("/transactions/{transaction_id}/verify", response_model=TransactionResponse)
def verify_transaction(transaction_id: str, action_data: VerificationAction):
    txn = update_verification_status(transaction_id, action_data.action)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_summary():
    return get_dashboard_summary()


@router.get("/analytics")
def get_analytics():
    return get_analytics_data()


@router.get("/model/metrics")
def get_model_metrics():
    metrics_path = os.path.join(settings.ARTIFACTS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model metrics artifact not found. Please train model first.")

    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics = json.load(f)
    return metrics


@router.post("/demo/seed")
def seed_demo(count: int = Query(40, ge=5, le=200)):
    num_created = seed_demo_data(count=count)
    return {
        "status": "success",
        "message": f"Successfully generated {num_created} simulated demo transactions.",
        "count": num_created
    }


@router.post("/demo/reset")
def reset_demo():
    reset_transactions()
    return {"status": "success", "message": "All transaction history cleared successfully."}


@router.get("/settings")
def read_settings():
    approve, verify = get_thresholds()
    return {
        "approve_threshold": approve,
        "verify_threshold": verify,
        "policy": {
            "low_risk": f"0 to {approve - 1} -> APPROVE",
            "medium_risk": f"{approve} to {verify - 1} -> VERIFY",
            "high_risk": f"{verify} to 100 -> BLOCK"
        }
    }


@router.post("/settings")
def update_settings(payload: SettingsPayload):
    set_thresholds(payload.approve_threshold, payload.verify_threshold)
    return {
        "status": "success",
        "message": "Risk policy thresholds updated successfully.",
        "approve_threshold": payload.approve_threshold,
        "verify_threshold": payload.verify_threshold
    }


@router.post("/chat", response_model=ChatResponse)
def chat_with_gemini(payload: ChatRequest):
    history_dicts = [{"role": h.role, "content": h.content} for h in payload.history]
    result = generate_chat_response(payload.message, history_dicts)
    return ChatResponse(
        status=result["status"],
        reply=result["reply"],
        model=result["model"]
    )


@router.get("/news/fraud-intel")
def get_fraud_intel_news():
    articles = fetch_live_news()
    return {
        "status": "success",
        "count": len(articles),
        "articles": articles
    }

