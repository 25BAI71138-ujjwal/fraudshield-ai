import json
import uuid
import csv
import io
import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any

from app.database.db import get_db, get_thresholds
from app.schemas.transaction import TransactionCreate, TransactionResponse, DashboardSummary
from ml.predict import get_predictor


def create_transaction(data: TransactionCreate) -> TransactionResponse:
    predictor = get_predictor()
    approve_thresh, verify_thresh = get_thresholds()

    feature_dict = data.model_dump()
    result = predictor.predict(
        features=feature_dict,
        approve_threshold=approve_thresh,
        verify_threshold=verify_thresh
    )

    txn_id = f"TXN-{random.randint(10000, 99999)}"
    now_iso = datetime.now(timezone.utc).isoformat()
    reasons_json = json.dumps(result["reasons"])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (
                transaction_id, timestamp, amount, transaction_hour,
                transaction_frequency_24h, failed_attempts_24h, is_new_device,
                is_new_beneficiary, amount_deviation_score, location_risk_score,
                payment_method, merchant_category, fraud_probability,
                risk_score, risk_level, decision, reasons,
                inference_time_ms, is_demo, verification_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            txn_id, now_iso, data.amount, data.transaction_hour,
            data.transaction_frequency_24h, data.failed_attempts_24h, data.is_new_device,
            data.is_new_beneficiary, data.amount_deviation_score, data.location_risk_score,
            data.payment_method, data.merchant_category, result["fraud_probability"],
            result["risk_score"], result["risk_level"], result["decision"], reasons_json,
            result["inference_time_ms"], 1, "NONE" if result["decision"] != "VERIFY" else "PENDING"
        ))

    return TransactionResponse(
        transaction_id=txn_id,
        timestamp=now_iso,
        amount=data.amount,
        transaction_hour=data.transaction_hour,
        transaction_frequency_24h=data.transaction_frequency_24h,
        failed_attempts_24h=data.failed_attempts_24h,
        is_new_device=data.is_new_device,
        is_new_beneficiary=data.is_new_beneficiary,
        amount_deviation_score=data.amount_deviation_score,
        location_risk_score=data.location_risk_score,
        payment_method=data.payment_method,
        merchant_category=data.merchant_category,
        fraud_probability=result["fraud_probability"],
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        decision=result["decision"],
        reasons=result["reasons"],
        inference_time_ms=result["inference_time_ms"],
        is_demo=True,
        verification_status="NONE" if result["decision"] != "VERIFY" else "PENDING"
    )


def list_transactions(
    decision: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    date_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 20
) -> Tuple[int, List[TransactionResponse]]:
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM transactions WHERE 1=1"
        params = []

        if decision and decision.upper() != "ALL":
            query += " AND decision = ?"
            params.append(decision.upper())

        if risk_level and risk_level.upper() != "ALL":
            query += " AND risk_level = ?"
            params.append(risk_level.upper())

        if search:
            query += " AND (transaction_id LIKE ? OR payment_method LIKE ? OR merchant_category LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s])

        if date_filter:
            # simple prefix or ISO filter
            query += " AND timestamp LIKE ?"
            params.append(f"{date_filter}%")

        # Count total
        count_query = query.replace("SELECT *", "SELECT COUNT(*)", 1)
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        # Order & Paginate
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        offset = (page - 1) * limit
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = []
        for r in rows:
            reasons_list = json.loads(r["reasons"]) if r["reasons"] else []
            results.append(TransactionResponse(
                transaction_id=r["transaction_id"],
                timestamp=r["timestamp"],
                amount=r["amount"],
                transaction_hour=r["transaction_hour"],
                transaction_frequency_24h=r["transaction_frequency_24h"],
                failed_attempts_24h=r["failed_attempts_24h"],
                is_new_device=r["is_new_device"],
                is_new_beneficiary=r["is_new_beneficiary"],
                amount_deviation_score=r["amount_deviation_score"],
                location_risk_score=r["location_risk_score"],
                payment_method=r["payment_method"],
                merchant_category=r["merchant_category"],
                fraud_probability=r["fraud_probability"],
                risk_score=r["risk_score"],
                risk_level=r["risk_level"],
                decision=r["decision"],
                reasons=reasons_list,
                inference_time_ms=r["inference_time_ms"],
                is_demo=bool(r["is_demo"]),
                verification_status=r["verification_status"]
            ))

        return total, results


def get_transaction_by_id(transaction_id: str) -> Optional[TransactionResponse]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE transaction_id = ?", (transaction_id,))
        r = cursor.fetchone()
        if not r:
            return None

        return TransactionResponse(
            transaction_id=r["transaction_id"],
            timestamp=r["timestamp"],
            amount=r["amount"],
            transaction_hour=r["transaction_hour"],
            transaction_frequency_24h=r["transaction_frequency_24h"],
            failed_attempts_24h=r["failed_attempts_24h"],
            is_new_device=r["is_new_device"],
            is_new_beneficiary=r["is_new_beneficiary"],
            amount_deviation_score=r["amount_deviation_score"],
            location_risk_score=r["location_risk_score"],
            payment_method=r["payment_method"],
            merchant_category=r["merchant_category"],
            fraud_probability=r["fraud_probability"],
            risk_score=r["risk_score"],
            risk_level=r["risk_level"],
            decision=r["decision"],
            reasons=json.loads(r["reasons"]) if r["reasons"] else [],
            inference_time_ms=r["inference_time_ms"],
            is_demo=bool(r["is_demo"]),
            verification_status=r["verification_status"]
        )


def update_verification_status(transaction_id: str, action: str) -> Optional[TransactionResponse]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT decision, verification_status FROM transactions WHERE transaction_id = ?", (transaction_id,))
        row = cursor.fetchone()
        if not row:
            return None

        # If transaction was originally BLOCK, do not allow manual APPROVE override without clear rejection
        new_status = "VERIFIED" if action == "APPROVE" else "REJECTED"
        new_decision = "APPROVE" if action == "APPROVE" else "BLOCK"

        cursor.execute("""
            UPDATE transactions 
            SET verification_status = ?, decision = ?
            WHERE transaction_id = ?
        """, (new_status, new_decision, transaction_id))

    return get_transaction_by_id(transaction_id)


def get_dashboard_summary() -> DashboardSummary:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*), SUM(amount), AVG(inference_time_ms) FROM transactions")
        total_count, total_amount, avg_latency = cursor.fetchone()

        total_count = total_count or 0
        total_amount = round(total_amount or 0.0, 2)
        avg_latency = round(avg_latency or 0.0, 2)

        cursor.execute("SELECT decision, COUNT(*) FROM transactions GROUP BY decision")
        decisions_raw = dict(cursor.fetchall())

        approved_count = decisions_raw.get("APPROVE", 0)
        flagged_count = decisions_raw.get("VERIFY", 0)
        blocked_count = decisions_raw.get("BLOCK", 0)

        cursor.execute("SELECT risk_level, COUNT(*) FROM transactions GROUP BY risk_level")
        risk_raw = dict(cursor.fetchall())

        fraud_rate = 0.0
        if total_count > 0:
            fraud_rate = round(((flagged_count + blocked_count) / total_count) * 100, 2)

        return DashboardSummary(
            total_transactions=total_count,
            approved_count=approved_count,
            flagged_count=flagged_count,
            blocked_count=blocked_count,
            fraud_detection_rate=fraud_rate,
            avg_inference_time_ms=avg_latency,
            total_volume=total_amount,
            decision_distribution={
                "APPROVE": approved_count,
                "VERIFY": flagged_count,
                "BLOCK": blocked_count
            },
            risk_distribution={
                "LOW": risk_raw.get("LOW", 0),
                "MEDIUM": risk_raw.get("MEDIUM", 0),
                "HIGH": risk_raw.get("HIGH", 0)
            }
        )


def get_analytics_data() -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Hourly volume and risk
        cursor.execute("""
            SELECT transaction_hour, COUNT(*) as count, AVG(risk_score) as avg_risk,
                   SUM(CASE WHEN decision = 'BLOCK' THEN 1 ELSE 0 END) as blocks
            FROM transactions
            GROUP BY transaction_hour
            ORDER BY transaction_hour ASC
        """)
        hourly = [
            {
                "hour": f"{row['transaction_hour']:02d}:00",
                "count": row["count"],
                "avg_risk": round(row["avg_risk"] or 0, 1),
                "blocked": row["blocks"]
            }
            for row in cursor.fetchall()
        ]

        # 2. Risk distribution buckets
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN risk_score BETWEEN 0 AND 19 THEN 1 ELSE 0 END) as b1,
                SUM(CASE WHEN risk_score BETWEEN 20 AND 39 THEN 1 ELSE 0 END) as b2,
                SUM(CASE WHEN risk_score BETWEEN 40 AND 59 THEN 1 ELSE 0 END) as b3,
                SUM(CASE WHEN risk_score BETWEEN 60 AND 79 THEN 1 ELSE 0 END) as b4,
                SUM(CASE WHEN risk_score BETWEEN 80 AND 100 THEN 1 ELSE 0 END) as b5
            FROM transactions
        """)
        b_row = cursor.fetchone()
        risk_buckets = [
            {"range": "0-19 (Safe)", "count": b_row[0] or 0},
            {"range": "20-39 (Low)", "count": b_row[1] or 0},
            {"range": "40-59 (Caution)", "count": b_row[2] or 0},
            {"range": "60-79 (Suspicious)", "count": b_row[3] or 0},
            {"range": "80-100 (Critical)", "count": b_row[4] or 0},
        ]

        # 3. Payment channel breakdown
        cursor.execute("""
            SELECT payment_method, COUNT(*) as count,
                   SUM(CASE WHEN decision = 'APPROVE' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN decision = 'VERIFY' THEN 1 ELSE 0 END) as verified,
                   SUM(CASE WHEN decision = 'BLOCK' THEN 1 ELSE 0 END) as blocked
            FROM transactions
            GROUP BY payment_method
        """)
        payment_channels = [
            {
                "channel": row["payment_method"],
                "total": row["count"],
                "approved": row["approved"],
                "verified": row["verified"],
                "blocked": row["blocked"]
            }
            for row in cursor.fetchall()
        ]

        # 4. Top reasons breakdown
        cursor.execute("SELECT reasons FROM transactions WHERE decision IN ('VERIFY', 'BLOCK')")
        reason_rows = cursor.fetchall()
        reason_counts: Dict[str, int] = {}
        for r in reason_rows:
            try:
                r_list = json.loads(r["reasons"])
                for item in r_list:
                    # Clean/normalize key
                    key = item.split(":")[0] if ":" in item else item
                    reason_counts[key] = reason_counts.get(key, 0) + 1
            except Exception:
                pass

        top_reasons = [
            {"reason": k, "count": v}
            for k, v in sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)[:6]
        ]

        # 5. Amount tier vs fraud rate
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN amount < 50 THEN '< $50'
                    WHEN amount BETWEEN 50 AND 200 THEN '$50 - $200'
                    WHEN amount BETWEEN 201 AND 1000 THEN '$201 - $1,000'
                    WHEN amount BETWEEN 1001 AND 5000 THEN '$1,001 - $5,000'
                    ELSE '> $5,000'
                END as tier,
                COUNT(*) as count,
                AVG(risk_score) as avg_risk,
                SUM(CASE WHEN decision = 'BLOCK' THEN 1 ELSE 0 END) as blocked
            FROM transactions
            GROUP BY tier
            ORDER BY count DESC
        """)
        amount_tiers = [
            {
                "tier": row["tier"],
                "count": row["count"],
                "avg_risk": round(row["avg_risk"] or 0, 1),
                "blocked": row["blocked"]
            }
            for row in cursor.fetchall()
        ]

        return {
            "hourly_trends": hourly,
            "risk_buckets": risk_buckets,
            "payment_channels": payment_channels,
            "top_reasons": top_reasons,
            "amount_tiers": amount_tiers
        }


def seed_demo_data(count: int = 50) -> int:
    """
    Populates SQLite with realistic simulated transactions representing normal,
    suspicious, and high-risk scenarios across the last 24-48 hours.
    """
    scenarios = [
        # Normal lunch / retail
        {"amount": 34.50, "hour": 13, "freq": 2, "failed": 0, "dev": 0, "bene": 0, "dev_score": 0.8, "loc": 0.05, "method": "UPI", "cat": "Food & Dining"},
        {"amount": 120.00, "hour": 15, "freq": 3, "failed": 0, "dev": 0, "bene": 0, "dev_score": 1.1, "loc": 0.10, "method": "CREDIT_CARD", "cat": "Retail"},
        {"amount": 15.20, "hour": 9, "freq": 1, "failed": 0, "dev": 0, "bene": 0, "dev_score": 0.6, "loc": 0.02, "method": "UPI", "cat": "Grocery"},
        {"amount": 250.00, "hour": 19, "freq": 4, "failed": 0, "dev": 0, "bene": 1, "dev_score": 1.4, "loc": 0.15, "method": "NET_BANKING", "cat": "Transfer"},
        # Borderline / Verify
        {"amount": 890.00, "hour": 22, "freq": 6, "failed": 1, "dev": 1, "bene": 0, "dev_score": 2.8, "loc": 0.35, "method": "DEBIT_CARD", "cat": "Electronics"},
        {"amount": 1250.00, "hour": 14, "freq": 5, "failed": 1, "dev": 0, "bene": 1, "dev_score": 3.2, "loc": 0.40, "method": "UPI", "cat": "Travel"},
        # Critical / High-risk fraud pattern
        {"amount": 7500.00, "hour": 3, "freq": 18, "failed": 4, "dev": 1, "bene": 1, "dev_score": 9.5, "loc": 0.88, "method": "NET_BANKING", "cat": "Transfer"},
        {"amount": 3800.00, "hour": 2, "freq": 14, "failed": 3, "dev": 1, "bene": 1, "dev_score": 7.2, "loc": 0.75, "method": "CREDIT_CARD", "cat": "Electronics"},
        {"amount": 420.00, "hour": 4, "freq": 22, "failed": 2, "dev": 1, "bene": 0, "dev_score": 4.1, "loc": 0.68, "method": "UPI", "cat": "Gaming"}
    ]

    inserted = 0
    now = datetime.now(timezone.utc)

    for i in range(count):
        preset = random.choice(scenarios)
        # Add slight natural jitter
        amount = max(5.0, round(preset["amount"] * random.uniform(0.85, 1.25), 2))
        hour = preset["hour"]
        freq = max(1, preset["freq"] + random.randint(-1, 2))
        failed = max(0, preset["failed"] + random.choice([0, 0, 1]))
        is_dev = preset["dev"]
        is_bene = preset["bene"]
        dev_score = round(preset["dev_score"] * random.uniform(0.9, 1.15), 2)
        loc = min(1.0, max(0.0, round(preset["loc"] + random.uniform(-0.05, 0.08), 2)))

        txn_in = TransactionCreate(
            amount=amount,
            transaction_hour=hour,
            transaction_frequency_24h=freq,
            failed_attempts_24h=failed,
            is_new_device=is_dev,
            is_new_beneficiary=is_bene,
            amount_deviation_score=dev_score,
            location_risk_score=loc,
            payment_method=preset["method"],
            merchant_category=preset["cat"]
        )

        res = create_transaction(txn_in)

        # Spread timestamps backwards across 48h
        time_offset = timedelta(minutes=random.randint(5, 2880))
        fake_time = (now - time_offset).isoformat()

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE transactions SET timestamp = ? WHERE transaction_id = ?", (fake_time, res.transaction_id))

        inserted += 1

    return inserted


def reset_transactions() -> bool:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions")
    return True


def export_transactions_csv(
    decision: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None
) -> str:
    _, txns = list_transactions(decision=decision, risk_level=risk_level, search=search, limit=10000)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Transaction ID", "Timestamp (UTC)", "Amount", "Hour",
        "Velocity (24h)", "Failed Attempts", "New Device", "New Beneficiary",
        "Deviation Score", "Location Risk", "Channel", "Merchant Category",
        "Fraud Probability", "Risk Score", "Risk Level", "Decision",
        "Latency (ms)", "Verification Status", "Explainability Reasons"
    ])

    for t in txns:
        writer.writerow([
            t.transaction_id,
            t.timestamp,
            f"{t.amount:.2f}",
            t.transaction_hour,
            t.transaction_frequency_24h,
            t.failed_attempts_24h,
            t.is_new_device,
            t.is_new_beneficiary,
            f"{t.amount_deviation_score:.2f}",
            f"{t.location_risk_score:.2f}",
            t.payment_method,
            t.merchant_category,
            f"{t.fraud_probability:.4f}",
            t.risk_score,
            t.risk_level,
            t.decision,
            f"{t.inference_time_ms:.2f}",
            t.verification_status,
            " | ".join(t.reasons)
        ])

    return output.getvalue()
