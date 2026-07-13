import json
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import BloodBank, BloodStock, BloodRequest, Donation, Patient
from app.services.ai import get_ai_client
from app.config import settings
from app.services.disease_demand import build_disease_demand_context

CSV_PATH = Path(__file__).parent.parent.parent / "data" / "eraktkosh_stock.csv"


def _build_national_stock_summary() -> str:
    try:
        import pandas as pd
        df = pd.read_csv(CSV_PATH, dtype=str)
        df["availability"] = pd.to_numeric(df["availability"], errors="coerce").fillna(0).astype(int)
        df = df[df["availability"] > 0]

        # Top 10 states by total stock
        state_totals = df.groupby("state")["availability"].sum().sort_values(ascending=False).head(10)

        # National totals by blood group (across all components)
        bg_totals = df.groupby("blood_group")["availability"].sum().sort_values(ascending=False)

        # Critical: states with < 500 total units
        all_state_totals = df.groupby("state")["availability"].sum()
        critical_states = all_state_totals[all_state_totals < 500].sort_values()

        lines = [f"NATIONAL eRaktKosh STOCK (4443 banks, scraped {Path(CSV_PATH).stat().st_mtime and 'recently'}):"]
        lines.append("Top states by total units: " + ", ".join(f"{s}:{v}" for s, v in state_totals.items()))
        lines.append("National stock by blood group: " + ", ".join(f"{bg}:{v}" for bg, v in bg_totals.items()))
        if len(critical_states):
            lines.append("LOW-STOCK states (<500 units): " + ", ".join(f"{s}:{v}" for s, v in critical_states.items()))
        return "\n".join(lines)
    except Exception as e:
        return f"National stock data unavailable: {e}"



def _build_stock_summary(db: Session) -> str:
    banks = db.query(BloodBank).all()
    lines = ["CURRENT BLOOD BANK STOCK LEVELS:"]
    for bank in banks:
        stock = db.query(BloodStock).filter(BloodStock.bank_id == bank.id).all()
        stock_str = ", ".join(
            f"{s.blood_type}:{s.units}u{'[CRITICAL]' if s.units < 10 else '[LOW]' if s.units < 20 else ''}"
            for s in sorted(stock, key=lambda x: x.units)
        )
        lines.append(f"- {bank.name} ({bank.city}, {bank.state}): {stock_str}")
    return "\n".join(lines)


def _build_request_summary(db: Session) -> str:
    since = datetime.utcnow() - timedelta(days=7)
    requests = db.query(BloodRequest).filter(BloodRequest.created_at >= since).all()
    if not requests:
        return "PENDING BLOOD REQUESTS (last 7 days): None"
    lines = ["PENDING BLOOD REQUESTS (last 7 days):"]
    for r in requests:
        lines.append(f"- {r.blood_type} [{r.urgency.upper()}] x{r.quantity} units — status: {r.status}")
    return "\n".join(lines)


def _build_donation_summary(db: Session) -> str:
    since = datetime.utcnow() - timedelta(days=30)
    donations = db.query(Donation).filter(Donation.donated_at >= since).all()
    if not donations:
        return "DONATIONS (last 30 days): None recorded"
    by_type: dict = {}
    for d in donations:
        by_type[d.blood_type] = by_type.get(d.blood_type, 0) + d.quantity
    lines = ["DONATIONS (last 30 days):"]
    for bt, total in sorted(by_type.items()):
        lines.append(f"- {bt}: {total} units donated")
    return "\n".join(lines)


def _build_patient_summary(db: Session) -> str:
    patients = db.query(Patient).all()
    if not patients:
        return "REGISTERED PATIENTS: None"
    disease_counts: dict = {}
    for p in patients:
        tag = p.disease or "unspecified"
        disease_counts[tag] = disease_counts.get(tag, 0) + 1
    lines = ["REGISTERED PATIENTS BY DISEASE:"]
    for disease, count in disease_counts.items():
        lines.append(f"- {disease}: {count} patient(s)")
    return "\n".join(lines)


def run_greenr_analysis(db: Session, state: str = None) -> dict:
    stock_summary = _build_stock_summary(db)
    request_summary = _build_request_summary(db)
    donation_summary = _build_donation_summary(db)
    patient_summary = _build_patient_summary(db)
    national_summary = _build_national_stock_summary()
    disease_demand = build_disease_demand_context(state)

    system_prompt = """You are a blood supply chain analyst for India.
Analyze blood bank data and identify shortage risks.
Respond with valid JSON ONLY. No markdown. No text outside JSON. Be concise.

Return this structure (max 4 critical_alerts, max 3 regional_analysis, max 4 immediate_actions, keep strings short):
{
  "summary": "1-2 sentence summary",
  "overall_risk": "low|medium|high|critical",
  "critical_alerts": [{"region": "city", "blood_type": "X+", "risk_level": "critical|high|medium", "current_units": 5, "reason": "short reason", "recommendation": "short action"}],
  "regional_analysis": [{"region": "city", "overall_risk": "high", "key_issues": ["issue"], "strengths": ["strength"]}],
  "immediate_actions": ["action 1", "action 2"],
  "demand_forecast": "1-2 sentence forecast"
}"""

    user_message = f"""Analyze this real-time blood supply data from LifeForge platform:

{stock_summary}

{request_summary}

{donation_summary}

{patient_summary}

{national_summary}

{disease_demand}

O- universal donor: only 7% of population, always critically needed in emergencies.

Identify critical shortages, regions at risk, and provide specific actionable recommendations. Consider the disease burden (patient counts above are research-backed from published epidemiology), seasonal supply pressure, component-specific needs (PRBCs vs Platelets vs FFP), and pending requests when assessing urgency."""

    client = get_ai_client()
    response = client.chat.completions.create(
        model=settings.ai_chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
        max_tokens=3500,
    )

    raw = response.choices[0].message.content.strip()

    # strip markdown code fences
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            p = part.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                raw = p
                break

    # find start of JSON object and use raw_decode (handles trailing text)
    start = raw.find("{")
    result = None
    if start != -1:
        try:
            result, _ = json.JSONDecoder().raw_decode(raw, start)
        except json.JSONDecodeError:
            pass

    if result is None:
        result = {
            "summary": raw[:500],
            "overall_risk": "unknown",
            "critical_alerts": [],
            "regional_analysis": [],
            "immediate_actions": [],
            "demand_forecast": "",
            "parse_error": True,
        }

    result["generated_at"] = datetime.utcnow().isoformat() + "Z"
    return result
