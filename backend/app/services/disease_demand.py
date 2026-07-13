"""
Epidemiology-driven blood demand engine.

Patient counts sourced from peer-reviewed literature (2023-2025).
See /GreenPT/docs/disease-demand-prediction.md for full research basis and decisions.
"""

from datetime import datetime

# ── Patient counts by state (diagnosed/treated only — see Decision 2 in docs) ──

DISEASE_STATE_PATIENTS: dict[str, dict[str, int]] = {
    # Thalassemia Major — 1,50,000 national; hotspots: MH, GJ, PB, WB
    "thalassemia": {
        "Maharashtra": 28000,
        "Gujarat": 25000,
        "Punjab": 18000,
        "West Bengal": 16000,
        "Uttar Pradesh": 12000,
        "Rajasthan": 8000,
        "Delhi": 7000,
        "Tamil Nadu": 6000,
        "Andhra Pradesh": 5000,
        "Karnataka": 5000,
        "Madhya Pradesh": 4000,
        "Bihar": 3000,
        "Haryana": 3000,
        "Odisha": 2000,
        "Others": 8000,
    },
    # Sickle Cell Disease — 1,50,000 diagnosed; hotspots: MP, CG, MH, GJ, OD, TS
    "sickle_cell": {
        "Madhya Pradesh": 38000,
        "Chhattisgarh": 28000,
        "Maharashtra": 22000,
        "Gujarat": 18000,
        "Odisha": 16000,
        "Telangana": 12000,
        "Assam": 6000,
        "Jharkhand": 4000,
        "Rajasthan": 3000,
        "Others": 3000,
    },
    # Hemophilia — 26,000 diagnosed (80% of 1.3L remain undiagnosed; see Decision 2)
    "hemophilia": {
        "Maharashtra": 3500,
        "Gujarat": 2500,
        "Uttar Pradesh": 3000,
        "Delhi": 2000,
        "Punjab": 2000,
        "Tamil Nadu": 2000,
        "Karnataka": 2000,
        "Andhra Pradesh": 1500,
        "West Bengal": 2000,
        "Odisha": 1000,
        "Others": 2500,
    },
    # Aplastic Anemia — ~50,000 active; rural-heavy (pesticide/benzene exposure)
    "aplastic_anemia": {
        "Uttar Pradesh": 7000,
        "Bihar": 4000,
        "Maharashtra": 7000,
        "Rajasthan": 4000,
        "Madhya Pradesh": 3000,
        "West Bengal": 3500,
        "Odisha": 2000,
        "Tamil Nadu": 3000,
        "Andhra Pradesh": 2500,
        "Karnataka": 2500,
        "Others": 11500,
    },
}

# ── Transfusion profiles per disease ──
# interval_days: days between transfusion sessions (adequate-care standard, not actual undertransfused reality)
# units: blood units per session
# component: blood component required

TRANSFUSION_PROFILES: dict[str, dict] = {
    "thalassemia": {
        "interval_days": 21,
        "units_per_session": 2,
        "component": "Packed Red Blood Cells",
        "crisis_spike_pct": 0,
    },
    "sickle_cell": {
        "interval_days": 45,
        "units_per_session": 2,
        "component": "Packed Red Blood Cells",
        "crisis_spike_pct": 15,  # 15% of patients may have crisis in any given month needing 3-4 units
    },
    "hemophilia": {
        "interval_days": 10,
        "units_per_session": 1,
        "component": "Fresh Frozen Plasma / Cryoprecipitate",
        "crisis_spike_pct": 0,
    },
    "aplastic_anemia_rbc": {
        "interval_days": 10,
        "units_per_session": 2,
        "component": "Packed Red Blood Cells",
        "crisis_spike_pct": 0,
    },
    "aplastic_anemia_plt": {
        "interval_days": 7,
        "units_per_session": 1,
        "component": "Platelets",
        "crisis_spike_pct": 0,
    },
}

# ── Seasonal supply index (applied to shortage risk, not demand — see Decision 6) ──
# Reflects documented 30-40% drop in donations during summer/festivals

SEASONAL_SUPPLY_INDEX: dict[int, float] = {
    1: 1.00,   # January  — normal
    2: 1.00,   # February — normal
    3: 0.70,   # March    — summer begins, donations drop
    4: 0.65,   # April    — peak summer heat
    5: 0.68,   # May      — still hot
    6: 0.90,   # June     — recovery, camp season
    7: 0.90,   # July     — moderate
    8: 0.90,   # August   — moderate
    9: 0.88,   # September
    10: 0.75,  # October  — festival season (Navratri/Diwali)
    11: 0.78,  # November — post-festival
    12: 0.85,  # December — year-end moderate
}


def compute_monthly_demand(state: str = None) -> dict:
    """
    Compute expected monthly blood demand by disease.

    Returns dict with per-disease breakdown:
    {
      "thalassemia": {"patients": int, "monthly_units": int, "component": str},
      "sickle_cell": {"patients": int, "monthly_units": int, "component": str},
      "hemophilia": {"patients": int, "monthly_units": int, "component": str},
      "aplastic_anemia": {"patients": int, "monthly_prbc": int, "monthly_platelets": int},
      "total_prbc": int,
      "total_platelets": int,
      "total_ffp": int,
    }
    """
    result = {}
    total_prbc = 0
    total_platelets = 0
    total_ffp = 0

    for disease, state_map in DISEASE_STATE_PATIENTS.items():
        if state:
            patients = state_map.get(state, state_map.get("Others", 0))
        else:
            patients = sum(state_map.values())

        if disease == "aplastic_anemia":
            rbc_profile = TRANSFUSION_PROFILES["aplastic_anemia_rbc"]
            plt_profile = TRANSFUSION_PROFILES["aplastic_anemia_plt"]
            monthly_rbc = int(patients * (30 / rbc_profile["interval_days"]) * rbc_profile["units_per_session"])
            monthly_plt = int(patients * (30 / plt_profile["interval_days"]) * plt_profile["units_per_session"])
            result["aplastic_anemia"] = {
                "patients": patients,
                "monthly_prbc": monthly_rbc,
                "monthly_platelets": monthly_plt,
                "component": "Packed Red Blood Cells + Platelets",
            }
            total_prbc += monthly_rbc
            total_platelets += monthly_plt
        else:
            profile = TRANSFUSION_PROFILES[disease]
            monthly = int(patients * (30 / profile["interval_days"]) * profile["units_per_session"])
            # Add crisis spike buffer for sickle cell
            if profile["crisis_spike_pct"] > 0:
                monthly = int(monthly * (1 + profile["crisis_spike_pct"] / 100))
            result[disease] = {
                "patients": patients,
                "monthly_units": monthly,
                "component": profile["component"],
            }
            if "Red Blood" in profile["component"]:
                total_prbc += monthly
            elif "Plasma" in profile["component"] or "Cryo" in profile["component"]:
                total_ffp += monthly

    result["total_prbc"] = total_prbc
    result["total_platelets"] = total_platelets
    result["total_ffp"] = total_ffp
    return result


def build_disease_demand_context(state: str = None) -> str:
    """
    Returns a formatted string ready to inject into GreenR prompt.
    Includes state-specific demand, seasonal supply risk, and national totals.
    """
    month = datetime.utcnow().month
    seasonal_idx = SEASONAL_SUPPLY_INDEX[month]
    month_name = datetime(2026, month, 1).strftime("%B")

    demand = compute_monthly_demand(state)
    scope = f"for {state}" if state else "nationally"

    lines = [
        f"DISEASE-DRIVEN BLOOD DEMAND FORECAST ({scope}, {month_name}):",
        f"Seasonal supply index this month: {seasonal_idx:.0%} of normal "
        f"({'SUMMER — donations suppressed 30-35%' if seasonal_idx < 0.72 else 'FESTIVAL SEASON — donations down 20-25%' if seasonal_idx < 0.82 else 'normal season'})",
        "",
        "Expected monthly demand by disease (research-backed patient counts × transfusion protocol):",
    ]

    thal = demand["thalassemia"]
    lines.append(
        f"  Thalassemia: {thal['patients']:,} patients → {thal['monthly_units']:,} units PRBCs/month "
        f"(2 units every 21 days)"
    )

    sc = demand["sickle_cell"]
    lines.append(
        f"  Sickle Cell Disease: {sc['patients']:,} patients → {sc['monthly_units']:,} units PRBCs/month "
        f"(includes 15% crisis buffer)"
    )

    hemo = demand["hemophilia"]
    lines.append(
        f"  Hemophilia: {hemo['patients']:,} diagnosed patients → {hemo['monthly_units']:,} units FFP/Cryo/month "
        f"(only diagnosed 26K modeled; 80% remain undiagnosed)"
    )

    aa = demand["aplastic_anemia"]
    lines.append(
        f"  Aplastic Anemia: {aa['patients']:,} patients → {aa['monthly_prbc']:,} units PRBCs + "
        f"{aa['monthly_platelets']:,} platelet pools/month"
    )

    lines += [
        "",
        f"TOTAL EXPECTED DEMAND {scope}: "
        f"{demand['total_prbc']:,} PRBCs | {demand['total_platelets']:,} Platelets | {demand['total_ffp']:,} FFP units",
        "",
        f"EFFECTIVE SHORTAGE PRESSURE: demand stays constant but supply is at {seasonal_idx:.0%} — "
        f"gap widens by {(1 - seasonal_idx) * 100:.0f}% this month.",
        "",
        "CRITICAL STATE HOTSPOTS:",
        "  Thalassemia: Maharashtra, Gujarat, Punjab, West Bengal",
        "  Sickle Cell: MP, Chhattisgarh, Maharashtra, Odisha, Telangana",
        "  Aplastic Anemia: UP, Bihar, Maharashtra (rural-heavy; pesticide exposure linked)",
        "",
        "India collects ~11M units/year vs ~15M needed → chronic 27% national deficit.",
        "Urban centers (Delhi, Mumbai, Hyderabad) account for 40% of total demand.",
    ]

    return "\n".join(lines)
