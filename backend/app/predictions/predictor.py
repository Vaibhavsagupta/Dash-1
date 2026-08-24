"""
Predictive AI Engine, Hybrid Rule+ML Predictor, XAI Factor Attribution & Digital Twin (Phase 8)
"""

from typing import Dict, Any, List, Tuple
from .schemas import XAIFactorItem, DigitalTwinSimulationItem

def predict_student_risk_and_backlog(
    attendance_pct: float,
    topic_mastery_avg: float,
    co_attainment_avg: float,
    test_trend: float,
    coding_accuracy: float
) -> Tuple[float, str, float, float, List[Dict[str, Any]], List[XAIFactorItem]]:
    """
    Hybrid Prediction Strategy Engine.
    Combines rule-based cold-start heuristics with statistical weight matrices.
    Returns: (risk_score, risk_level, predicted_cgpa, dropout_probability, backlog_forecast, xai_factors)
    """
    # 1. Overall Risk Score (0 - 100%)
    att_risk = max(0.0, (75.0 - attendance_pct) * 2.0)
    mastery_risk = max(0.0, (70.0 - topic_mastery_avg) * 1.5)
    trend_risk = max(0.0, -test_trend * 1.8)

    risk_score = round(min(98.0, max(5.0, att_risk + mastery_risk + trend_risk + 15.0)), 1)

    if risk_score >= 75.0:
        risk_level = "CRITICAL"
    elif risk_score >= 50.0:
        risk_level = "HIGH"
    elif risk_score >= 30.0:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    # 2. Predicted CGPA Forecast
    base_cgpa = 7.5
    cgpa_delta = ((topic_mastery_avg - 70.0) * 0.04) + ((attendance_pct - 75.0) * 0.02) + (test_trend * 0.03)
    predicted_cgpa = round(min(10.0, max(4.0, base_cgpa + cgpa_delta)), 2)

    # 3. Dropout Probability
    dropout_prob = round(min(90.0, max(2.0, (risk_score * 0.45) + (max(0.0, 60.0 - attendance_pct) * 0.5))), 1)

    # 4. Subject Backlog Forecast
    backlog_forecast = [
        {"subject_code": "AI702", "subject_name": "MLOps & Cloud Engineering", "backlog_probability": round(min(95.0, risk_score * 0.95), 1)},
        {"subject_code": "AI701", "subject_name": "Deep Learning Architecture", "backlog_probability": round(min(95.0, risk_score * 0.60), 1)},
        {"subject_code": "AI703", "subject_name": "Autonomous Agents", "backlog_probability": round(min(95.0, risk_score * 0.40), 1)}
    ]

    # 5. Explainable AI (XAI) Factors List
    xai_factors = []
    if attendance_pct < 75.0:
        xai_factors.append(XAIFactorItem(
            factor_name="Low Attendance Log",
            impact_level="HIGH_NEGATIVE",
            description=f"Attendance at {attendance_pct}% is below required 75.0% threshold.",
            contribution_weight=0.40
        ))
    if topic_mastery_avg < 60.0:
        xai_factors.append(XAIFactorItem(
            factor_name="Syllabus Topic Mastery Gap",
            impact_level="HIGH_NEGATIVE",
            description=f"Unit topic mastery at {topic_mastery_avg}% indicates core concept gaps.",
            contribution_weight=0.35
        ))
    if test_trend < 0:
        xai_factors.append(XAIFactorItem(
            factor_name="Declining Exam Performance Trend",
            impact_level="MEDIUM_NEGATIVE",
            description=f"Recent CBT test scores declined by {abs(test_trend)}%.",
            contribution_weight=0.25
        ))
    if not xai_factors:
        xai_factors.append(XAIFactorItem(
            factor_name="Consistent Academic Activity",
            impact_level="POSITIVE",
            description="Regular attendance and strong CBT performance maintained.",
            contribution_weight=1.0
        ))

    return risk_score, risk_level, predicted_cgpa, dropout_prob, backlog_forecast, xai_factors

def calculate_placement_readiness_score(
    technical: float = 82.0,
    coding: float = 75.0,
    aptitude: float = 80.0,
    communication: float = 85.0,
    projects: float = 78.0
) -> Tuple[float, str]:
    """
    Placement Readiness Score (PRS) Engine.
    Weights: Technical 35%, Coding 25%, Aptitude 15%, Communication 15%, Projects 10%.
    """
    prs = (technical * 0.35) + (coding * 0.25) + (aptitude * 0.15) + (communication * 0.15) + (projects * 0.10)
    prs_score = round(min(100.0, max(0.0, prs)), 1)

    if prs_score >= 82.0:
        tier = "TIER_1_PRODUCT_READY"
    elif prs_score >= 70.0:
        tier = "SERVICE_READY"
    else:
        tier = "NEEDS_UPSKILLING"

    return prs_score, tier

def simulate_digital_twin_scenarios(
    current_cgpa: float,
    current_risk: float
) -> List[DigitalTwinSimulationItem]:
    """
    Academic Digital Twin Scenario Simulator.
    Simulates outcome improvements under custom student action scenarios.
    """
    return [
        DigitalTwinSimulationItem(
            scenario_title="Scenario 1: Attendance Recovery to 85%",
            action_required="Attend 4 upcoming lectures for Cloud Computing Unit 2",
            predicted_cgpa_change=f"+0.25 (New: {round(current_cgpa + 0.25, 2)})",
            predicted_risk_change=f"-18.5% (New: {round(max(5.0, current_risk - 18.5), 1)}%)"
        ),
        DigitalTwinSimulationItem(
            scenario_title="Scenario 2: Complete 2 Adaptive Quizzes",
            action_required="Score >= 75% on Virtualization Adaptive Practice Quiz",
            predicted_cgpa_change=f"+0.40 (New: {round(current_cgpa + 0.40, 2)})",
            predicted_risk_change=f"-28.0% (New: {round(max(5.0, current_risk - 28.0), 1)}%)"
        )
    ]
