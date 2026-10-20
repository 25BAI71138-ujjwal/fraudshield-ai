from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any


class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0, le=1000000, description="Transaction amount in fiat currency")
    transaction_hour: int = Field(12, ge=0, le=23, description="Hour of the day (0-23)")
    transaction_frequency_24h: int = Field(1, ge=0, le=100, description="Transactions in past 24h")
    failed_attempts_24h: int = Field(0, ge=0, le=20, description="Failed PIN/password attempts in past 24h")
    is_new_device: int = Field(0, ge=0, le=1, description="1 if novel device, 0 if recognized")
    is_new_beneficiary: int = Field(0, ge=0, le=1, description="1 if newly added recipient, 0 if known")
    amount_deviation_score: float = Field(1.0, ge=0.01, le=100.0, description="Ratio of amount to 30-day baseline")
    location_risk_score: float = Field(0.0, ge=0.0, le=1.0, description="IP/geo anomaly score (0.0 to 1.0)")
    payment_method: Optional[str] = Field("UPI", description="Payment channel: UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING")
    merchant_category: Optional[str] = Field("Retail", description="Merchant sector: Retail, Electronics, Travel, Transfer, Gaming")

    @field_validator("payment_method")
    def validate_payment_method(cls, v):
        allowed = ["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "CRYPTO_GATEWAY"]
        if v.upper() not in allowed:
            return "UPI"
        return v.upper()


class TransactionResponse(BaseModel):
    transaction_id: str
    timestamp: str
    amount: float
    transaction_hour: int
    transaction_frequency_24h: int
    failed_attempts_24h: int
    is_new_device: int
    is_new_beneficiary: int
    amount_deviation_score: float
    location_risk_score: float
    payment_method: str
    merchant_category: str
    fraud_probability: float
    risk_score: int
    risk_level: str
    decision: str
    reasons: List[str]
    inference_time_ms: float
    is_demo: bool
    verification_status: str


class PaginatedTransactions(BaseModel):
    total: int
    page: int
    limit: int
    transactions: List[TransactionResponse]


class DashboardSummary(BaseModel):
    total_transactions: int
    approved_count: int
    flagged_count: int
    blocked_count: int
    fraud_detection_rate: float
    avg_inference_time_ms: float
    total_volume: float
    decision_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]


class SettingsPayload(BaseModel):
    approve_threshold: int = Field(..., ge=1, le=99)
    verify_threshold: int = Field(..., ge=1, le=99)

    @field_validator("verify_threshold")
    def check_thresholds(cls, v, values):
        approve = values.data.get("approve_threshold", 30)
        if v <= approve:
            raise ValueError("verify_threshold must be strictly greater than approve_threshold")
        return v


class VerificationAction(BaseModel):
    action: str = Field(..., description="Action: 'VERIFY' (approve) or 'REJECT' (block)")
    notes: Optional[str] = Field(None, description="Optional security reviewer notes")


class ChatMessageItem(BaseModel):
    role: str = Field(..., description="'user' or 'model'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User prompt or question")
    history: Optional[List[ChatMessageItem]] = Field(default=[], description="Previous conversation turns")


class ChatResponse(BaseModel):
    status: str
    reply: str
    model: str
