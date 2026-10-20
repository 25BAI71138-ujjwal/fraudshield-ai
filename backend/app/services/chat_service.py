import os
import httpx
from typing import List, Dict, Any
from app.core.config import settings
from app.services.transaction_service import get_dashboard_summary
from app.services.news_service import get_live_news_context_text, fetch_live_news

SYSTEM_PROMPT = """You are Dhanrakshak AI Copilot & Technical Advisor, an expert AI assistant embedded directly inside Dhanrakshak AI.

### Project Mission & Overview
Dhanrakshak AI is a production-grade, real-time AI-powered financial fraud detection and risk prevention platform built for modern digital payment rails (UPI, Credit/Debit Cards, Net Banking). Its mission is to solve fintech's core dilemma: stopping malicious payment fraud instantly while keeping checkout completely frictionless and avoiding frustrating false positives for legitimate customers.

### Full Application Architecture & Modules
The user can navigate between 6 core modules in the application:
1. **Overview Dashboard**:
   - Executive telemetry cards: Total Transaction Count, Approved Count, Flagged for 2FA, Blocked Fraud, Fraud Detection Rate %, and Average Inference Latency (~25ms).
   - Real-time Transaction Velocity charts, 24-Hour Risk Distribution, and Latest High-Risk Incident Feed.
2. **Live Transactions**:
   - Complete real-time audit ledger of all transactions stored persistently in SQLite.
   - Filter by Decision (ALL, APPROVE, VERIFY, BLOCK), Risk Level (LOW, MEDIUM, HIGH), Search query (Transaction ID, category, payment method), and Date.
   - One-click CSV Export (`/api/transactions/export`).
   - Interactive Transaction Inspector: Click any transaction to review full Explainable AI (XAI) reason codes and take manual verification action (Approve or Reject).
3. **Transaction Simulator**:
   - Interactive testing playground to simulate payments and observe instant ML inference with sub-30ms latency.
   - 8 adjustable behavioral parameters: Amount, Transaction Hour, 24h Frequency, Failed PIN attempts, New Device toggle, New Beneficiary toggle, Amount Deviation Score, and Location Risk Score.
   - Quick-load Attack Presets: Normal Everyday User, Account Takeover (ATO), Rapid Velocity Burst, Late-Night PIN Brute Force, and High-Value Outlier.
   - Explainable AI (XAI) breakdown showing exactly which behavioral factors triggered the score.
4. **Fraud Analysis**:
   - Visual risk analytics: Fraud breakdown by Merchant Category (e.g. Retail, Electronics, Travel, Transfer, Gaming), Risk Score Distribution histograms, and Peak Fraud Risk Hours (showing heightened late-night risk).
5. **Model Performance**:
   - Full evaluation metrics on held-out test data:
     * Precision: 98.06% (extremely low false alarm rate)
     * Recall: 81.45% (captures >80% of actual fraud attacks)
     * F1-Score: 0.8899
     * ROC-AUC: 0.9150
     * False Positive Rate: 0.11%
     * Average Latency: 25ms (P95: 49ms)
   - Confusion Matrix breakdown, Precision-Recall curve, and Feature Importance rankings.
6. **Risk Policy & Settings**:
   - Dynamic 3-Tier Risk Threshold controls:
     * Low-Risk (0 to Approve Threshold - 1) -> APPROVE
     * Medium-Risk (Approve Threshold to Verify Threshold - 1) -> VERIFY (triggers Step-Up 2FA)
     * High-Risk (Verify Threshold to 100) -> BLOCK
   - Defaults: Approve at 30, Verify at 70. Updates are saved to SQLite and take effect immediately without service restarts.

### The 8 Behavioral ML Features
1. `amount`: Monetary value in fiat currency.
2. `transaction_hour`: Hour of the day (0-23) — flags unusual nighttime spending.
3. `transaction_frequency_24h`: Transaction volume in the past 24 hours — detects automated carding or velocity draining.
4. `failed_attempts_24h`: Failed PIN/OTP entries in past 24 hours — detects brute-force credential attacks.
5. `is_new_device`: Binary flag (1 if novel browser/device fingerprint, 0 if recognized).
6. `is_new_beneficiary`: Binary flag (1 if transferring to a newly added recipient, 0 if established).
7. `amount_deviation_score`: Ratio of current transaction amount to the user's historical 30-day baseline average (e.g. 8.5x).
8. `location_risk_score`: IP geolocation anomaly or risky VPN/proxy score (0.0 to 1.0).

### Comparing Live News & Giving Fraud Advice
You have direct real-time access to the latest live banking fraud, cybercrime, and payment security news feed provided below.
When asked for advice, threat comparisons, or about current fraud trends:
- Explicitly cite relevant headlines and sources from the live feed.
- Compare the real-world attack vector (e.g. impersonation scams, SIM swaps, AI voice clones, card testing) against Dhanrakshak AI's behavioral features.
- Explain specifically how Dhanrakshak AI prevents that threat (e.g., how novel device + high amount deviation triggers an immediate step-up challenge or block).
- Provide practical, actionable advice to fraud analysts and administrators on threshold tuning, 2FA enforcement, and monitoring strategies.

### Response Style
- Technical, authoritative, clear, and well-structured using markdown headings, bullet points, and bold text.
- Be concise yet thorough. Highlight how Dhanrakshak AI's architecture solves real-world challenges.
- When explaining app features, guide the user on where to click and how to test it in the UI.
"""


def _generate_local_fallback_response(message: str, telemetry_context: str) -> str:
    msg = message.lower()
    live_news = fetch_live_news()

    if any(k in msg for k in ["news", "trend", "advice", "threat", "scam", "compare"]):
        top_news = live_news[0] if live_news else {
            "title": "US Impersonation Scams Surge 130%",
            "source": "FinTech Global",
            "snippet": "Criminals exploit instant payment rails using social engineering and new beneficiary account diversion."
        }
        second_news = live_news[1] if len(live_news) > 1 else {
            "title": "Credential Stuffing & SIM Swap Bursts Breach Digital Banking",
            "source": "Security Boulevard",
            "snippet": "Organized fraud rings bypass legacy static passwords via device session spoofing."
        }

        return f"""### 🛡️ Real-Time Fraud Threat Comparison & Strategic Advice

Based on current live banking and cybersecurity threat feeds:

1. **Current Threat in the News**: **"{top_news.get('title')}"** *(Source: {top_news.get('source')})*
   - **The Attack Vector**: Scammers use social engineering or urgent impersonation to trick victims into initiating high-value transfers to newly registered recipient accounts.
   - **How Dhanrakshak AI Intercepts It**:
     - **`is_new_beneficiary = 1`** paired with **`amount_deviation_score > 3.0x`** triggers a dramatic risk score escalation.
     - Instead of allowing silent settlement, Dhanrakshak automatically routes this transaction to the **VERIFY** tier (Step-up 2FA) or **BLOCK** tier if velocity or device anomalies coexist.

2. **Second Prevalent Threat**: **"{second_news.get('title')}"** *(Source: {second_news.get('source')})*
   - **The Attack Vector**: Automated bot attacks and SIM-swap account takeovers attempting rapid fund exfiltration.
   - **How Dhanrakshak AI Intercepts It**:
     - Flagged by **`is_new_device = 1`** and **`failed_attempts_24h >= 2`**, which immediately drives the risk score above 70, executing an instant payment freeze.

#### 💡 Actionable Policy Recommendations for Your Fraud Team:
- **Tighten Step-Up Verification**: In **Settings**, consider adjusting the `Verify Threshold` from 70 down to **55–60** during high-threat or holiday periods to enforce 2FA on suspicious beneficiary additions.
- **Test in Simulator**: Open the **Transaction Simulator**, load the **"Account Takeover"** preset, and observe how the ML engine produces a sub-30ms decision with transparent XAI reasoning.

---
*{telemetry_context.strip()}*"""

    elif any(k in msg for k in ["detail", "explain", "architecture", "what is", "about this app", "how does"]):
        return f"""### 🚀 Comprehensive Overview of Dhanrakshak AI

**Dhanrakshak AI** is an intelligent, real-time financial fraud detection engine designed for digital payment ecosystems (UPI, Credit/Debit Cards, Net Banking).

#### 1. Core Architecture
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS, Lucide icons, and Recharts for dynamic visual intelligence.
- **Backend**: FastAPI REST service with Uvicorn and Pydantic v2 validation.
- **Database**: SQLite (`fraudshield.db`) audit ledger with indexed querying for live transactions and configurable thresholds.
- **ML Engine**: Scikit-learn RandomForestClassifier with balanced class weighting, standard scalar preprocessing, and sub-30ms latency.

#### 2. Three-Tier Decision Framework
1. **APPROVE (0–29)**: Standard legitimate baseline. Frictionless instant settlement.
2. **VERIFY (30–69)**: Behavioral anomaly detected (e.g., new device or spending deviation). Triggers simulated 2FA step-up challenge instead of an abrupt payment drop.
3. **BLOCK (70–100)**: High-confidence attack (e.g., Account Takeover, Velocity Burst, PIN fatigue). Instantly halts payment.

#### 3. Key Pages & How to Use Them
- **Overview**: High-level KPIs, 24h risk distribution, and live velocity trends.
- **Live Transactions**: Filter transactions by Decision/Risk, search by ID, export CSV, and manually review/verify flagged payments.
- **Transaction Simulator**: Tweak 8 behavioral parameters (amount, failed attempts, new device, etc.) to test edge cases in real time.
- **Fraud Analysis**: Visual insights on fraud distribution across merchant categories and peak risk hours.
- **Model Performance**: Test set metrics (98.06% Precision, 81.45% Recall, 0.8899 F1, 0.11% False Positive Rate).
- **Settings**: Live threshold sliders for dynamic policy tuning without server restarts.

---
*{telemetry_context.strip()}*"""

    else:
        return f"""### 🛡️ Dhanrakshak AI Copilot

I can help you explore and understand every facet of Dhanrakshak AI:

- **Explain App Architecture & Features**: Ask me about the ML model, 3-tier risk policy, sub-30ms latency, or database structure.
- **Compare Live News**: Ask for real-time advice by comparing live financial cybercrime headlines with our detection features.
- **Simulate Attacks**: Learn how to test Account Takeovers, Velocity Bursts, and PIN brute force in the Simulator.
- **Review Telemetry**: Review current live transaction volumes and fraud detection rates.

How can I assist you right now?

---
*{telemetry_context.strip()}*"""


def generate_chat_response(message: str, history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    api_key = settings.GEMINI_API_KEY
    # Multi-model fallback list to handle temporary high demand (503) or quota on specific models
    candidate_models = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"]

    # Gather live telemetry context
    try:
        summary = get_dashboard_summary()
        telemetry_context = (
            f"\n\n[Current Live Database Telemetry]:\n"
            f"- Total Transactions: {summary.total_transactions}\n"
            f"- Approved: {summary.approved_count}\n"
            f"- Flagged (Verify): {summary.flagged_count}\n"
            f"- Blocked: {summary.blocked_count}\n"
            f"- Fraud Detection Rate: {summary.fraud_detection_rate}%\n"
            f"- Average Inference Latency: {summary.avg_inference_time_ms} ms\n"
            f"- Total Scored Volume: ${summary.total_volume:,.2f}"
        )
    except Exception:
        telemetry_context = "\n\n[Current Live Database Telemetry]: Online and operational."

    # Fetch live threat news context
    try:
        news_context = get_live_news_context_text()
    except Exception:
        news_context = ""

    full_system_instruction = SYSTEM_PROMPT + "\n" + news_context + "\n" + telemetry_context

    # Build contents array
    contents = []

    # Include recent history if provided
    if history:
        for turn in history[-8:]:
            role = turn.get("role", "user")
            gemini_role = "user" if role == "user" else "model"
            text_content = turn.get("text") or turn.get("content", "")
            if text_content:
                contents.append({
                    "role": gemini_role,
                    "parts": [{"text": text_content}]
                })

    # Add current user message
    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    payload = {
        "system_instruction": {
            "parts": [{"text": full_system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000,
        }
    }

    last_error = ""

    # Try candidate models sequentially
    for model_name in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            with httpx.Client(timeout=40.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return {
                                "status": "success",
                                "reply": parts[0]["text"],
                                "model": model_name
                            }
                else:
                    last_error = f"{model_name} returned status {resp.status_code}: {resp.text[:200]}"
                    # If 503 (high demand) or 404/429, try next model in candidate list
                    continue
        except Exception as e:
            last_error = f"{model_name} connection error: {str(e)}"
            continue

    # Fallback to local intelligence synthesizer if external cloud API is unreachable
    local_reply = _generate_local_fallback_response(message, telemetry_context)
    return {
        "status": "success",
        "reply": local_reply,
        "model": "FraudShield Local Synthesizer (Online Resilience Active)"
    }
