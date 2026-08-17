from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
import json

from .. import models
from .feature_engine import build_student_features
from .risk_predictor import MLRiskPredictor

def evaluate_and_explain_risk(student_id: str, db: Session) -> Dict[str, Any]:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return {"error": "Student not found"}

    # 1. Feature Engineering
    features = build_student_features(student.enrollment_no, db)

    # 2. Predict Risk using XGBoost + SHAP MLRiskPredictor
    predictor = MLRiskPredictor()
    pred_res = predictor.predict_risk(features)

    overall_risk = pred_res["overall_risk"]
    risk_level = pred_res["risk_level"]
    risk_status = pred_res["risk_status"]

    # 3. Determine Risk Trend
    past_history = db.query(models.RiskHistory).filter(
        models.RiskHistory.student_id == student.enrollment_no
    ).order_by(models.RiskHistory.recorded_at.desc()).limit(4).all()

    hist_scores = [h.overall_risk for h in reversed(past_history)] + [overall_risk]
    if len(hist_scores) < 3:
        risk_trend = "INSUFFICIENT_DATA"
    else:
        diffs = [hist_scores[i] - hist_scores[i-1] for i in range(1, len(hist_scores))]
        avg_diff = sum(diffs) / len(diffs)
        if avg_diff > 3.0:
            risk_trend = "STRONGLY_DECLINING" # Increasing risk = declining condition
        elif avg_diff > 0.5:
            risk_trend = "DECLINING"
        elif avg_diff < -3.0:
            risk_trend = "STRONGLY_IMPROVING" # Decreasing risk = improving condition
        elif avg_diff < -0.5:
            risk_trend = "IMPROVING"
        else:
            risk_trend = "STABLE"

    # Save to RiskScore
    score_rec = db.query(models.RiskScore).filter(
        models.RiskScore.student_id == student.enrollment_no
    ).first()

    if not score_rec:
        score_rec = models.RiskScore(student_id=student.enrollment_no)
        db.add(score_rec)

    prev_risk_level = score_rec.risk_level or "VERY_LOW"
    prev_overall_risk = score_rec.overall_risk or 0.0

    score_rec.academic_risk = pred_res["academic_risk"]
    score_rec.attendance_risk = pred_res["attendance_risk"]
    score_rec.engagement_risk = pred_res["engagement_risk"]
    score_rec.assessment_risk = pred_res["assessment_risk"]
    score_rec.backlog_risk = pred_res["backlog_risk"]
    score_rec.overall_risk = overall_risk
    score_rec.risk_level = risk_level
    score_rec.risk_trend = risk_trend
    score_rec.risk_status = risk_status
    db.commit()
    db.refresh(score_rec)

    # Record Risk History
    db.add(models.RiskHistory(
        student_id=student.enrollment_no,
        overall_risk=overall_risk,
        risk_level=risk_level
    ))

    # 4. Generate Measurable Risk Explanations
    db.query(models.RiskReason).filter(models.RiskReason.risk_id == score_rec.id).delete()

    reasons = []
    actions = []

    att_pct = features.get("attendance_percentage", 75.0)
    att_change_30d = features.get("attendance_change_30d", 0.0)
    if att_pct < 75.0:
        msg = f"Attendance dropped to {att_pct}% (below 75% threshold)."
        reasons.append({"feature": "attendance_percentage", "current_value": att_pct, "impact": "HIGH", "reason": msg})
        db.add(models.RiskReason(risk_id=score_rec.id, feature="attendance_percentage", current_value=att_pct, impact="HIGH", reason=msg))
        actions.append("Schedule attendance counseling session with Academic Advisor.")

    eng_score = features.get("engagement_score", 70.0)
    eng_change_30d = features.get("engagement_change_30d", 0.0)
    if eng_score < 60.0 or eng_change_30d < -15.0:
        msg = f"LMS Engagement dropped by {abs(eng_change_30d)}% to {eng_score}/100."
        reasons.append({"feature": "engagement_score", "current_value": eng_score, "previous_value": eng_score - eng_change_30d, "impact": "HIGH", "reason": msg})
        db.add(models.RiskReason(risk_id=score_rec.id, feature="engagement_score", current_value=eng_score, previous_value=eng_score - eng_change_30d, impact="HIGH", reason=msg))
        actions.append("Faculty check-in recommended for LMS resource access.")

    missed_tests = features.get("missed_tests", 0)
    if missed_tests > 0:
        msg = f"{missed_tests} assigned tests were missed."
        reasons.append({"feature": "missed_tests", "current_value": float(missed_tests), "impact": "HIGH", "reason": msg})
        db.add(models.RiskReason(risk_id=score_rec.id, feature="missed_tests", current_value=float(missed_tests), impact="HIGH", reason=msg))
        actions.append("Generate targeted practice test for missed concepts.")

    avg_marks = features.get("current_average_marks", 70.0)
    marks_change_30d = features.get("marks_change_30d", 0.0)
    if avg_marks < 60.0 or marks_change_30d < -10.0:
        msg = f"Academic performance dropped by {abs(marks_change_30d)}% to {avg_marks}/100."
        reasons.append({"feature": "current_average_marks", "current_value": avg_marks, "impact": "HIGH", "reason": msg})
        db.add(models.RiskReason(risk_id=score_rec.id, feature="current_average_marks", current_value=avg_marks, impact="HIGH", reason=msg))
        actions.append("Enrol student in subject-wise remedial tutorial sessions.")

    backlogs = features.get("backlog_count", 0)
    if backlogs > 0:
        msg = f"Active backlogs: {backlogs} courses pending."
        reasons.append({"feature": "backlog_count", "current_value": float(backlogs), "impact": "MEDIUM", "reason": msg})
        db.add(models.RiskReason(risk_id=score_rec.id, feature="backlog_count", current_value=float(backlogs), impact="MEDIUM", reason=msg))
        actions.append("Schedule backlog clearing prep track.")

    if not reasons:
        reasons.append({"feature": "status", "current_value": 0.0, "impact": "LOW", "reason": "Student has healthy academic performance and steady engagement."})
        actions.append("Maintain current study routine.")

    # 5. Risk Escalation Check
    level_hierarchy = {"VERY_LOW": 1, "LOW": 2, "MODERATE": 3, "HIGH": 4, "CRITICAL": 5}
    if level_hierarchy.get(risk_level, 1) > level_hierarchy.get(prev_risk_level, 1):
        alert_msg = f"Risk level escalated from {prev_risk_level} to {risk_level} (Score: {overall_risk})."
        existing_alert = db.query(models.AcademicAlert).filter(
            models.AcademicAlert.student_id == student.enrollment_no,
            models.AcademicAlert.alert_type == "RISK_ESCALATED",
            models.AcademicAlert.is_read == False
        ).first()
        if not existing_alert:
            db.add(models.AcademicAlert(
                student_id=student.enrollment_no,
                alert_type="RISK_ESCALATED",
                severity="HIGH" if risk_level in ["HIGH", "CRITICAL"] else "MEDIUM",
                message=alert_msg,
                previous_value=prev_overall_risk,
                current_value=overall_risk
            ))

    db.commit()

    return {
        "student_id": student.enrollment_no,
        "academic_risk": pred_res["academic_risk"],
        "attendance_risk": pred_res["attendance_risk"],
        "engagement_risk": pred_res["engagement_risk"],
        "assessment_risk": pred_res["assessment_risk"],
        "backlog_risk": pred_res["backlog_risk"],
        "overall_risk": overall_risk,
        "risk_level": risk_level,
        "risk_trend": risk_trend,
        "risk_status": risk_status,
        "model_version": pred_res.get("model_version", "XGBoost-v1.6-SHAP"),
        "top_reasons": pred_res.get("top_reasons", []),
        "shap_values": pred_res.get("shap_values", {}),
        "reasons": reasons,
        "recommended_actions": actions,
        "calculated_at": datetime.utcnow().isoformat()
    }
