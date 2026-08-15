from sqlalchemy.orm import Session
from datetime import datetime
import json

from .. import models
from . import engagement_engine

def calculate_student_risk(student_id: str, db: Session) -> dict:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return {"error": "Student not found"}

    # Fetch Part 1 Metrics
    acad_metrics = db.query(models.AcademicMetric).filter(
        models.AcademicMetric.student_id == student.enrollment_no
    ).all()
    
    if acad_metrics:
        avg_acad_score = sum(m.overall_score for m in acad_metrics) / len(acad_metrics)
    else:
        avg_acad_score = 70.0

    # Fetch Part 2 Metrics
    eng_metrics = engagement_engine.calculate_student_engagement(student.enrollment_no, db)
    eng_score = eng_metrics.get("engagement_score", 70.0)
    inactivity_hours = eng_metrics.get("inactivity_hours", 0.0)

    # 1. Academic Risk Score (0-100, where 100 = max risk)
    academic_risk = max(0.0, 100.0 - avg_acad_score)

    # 2. Engagement Risk Score (0-100, where 100 = max risk)
    engagement_risk = max(0.0, 100.0 - eng_score)

    # 3. Attendance Risk Score (0-100)
    attendance_pct = float(student.attendance) if student.attendance else 75.0
    attendance_risk = max(0.0, 100.0 - attendance_pct)

    # 4. Anomaly / Inactivity Penalty
    anomaly_penalty = 0.0
    if inactivity_hours >= 72:
        anomaly_penalty += 30.0
    elif inactivity_hours >= 48:
        anomaly_penalty += 15.0

    if student.active_backlogs > 0:
        anomaly_penalty += student.active_backlogs * 10.0

    # Fetch dynamic admin risk weights
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "risk_weights").first()
    if setting:
        try:
            rw = json.loads(setting.value)
            w_acad = rw.get("academic", {}).get("weight", 25.0) / 100.0
            w_att = rw.get("attendance", {}).get("weight", 20.0) / 100.0
            w_eng = rw.get("engagement", {}).get("weight", 15.0) / 100.0
            w_backlog = rw.get("backlog", {}).get("weight", 5.0) / 100.0
            w_other = 1.0 - (w_acad + w_att + w_eng + w_backlog)
            raw_risk_score = (
                academic_risk * w_acad +
                attendance_risk * w_att +
                engagement_risk * w_eng +
                min(100.0, anomaly_penalty) * w_backlog +
                (academic_risk * 0.5 + attendance_risk * 0.5) * max(0.0, w_other)
            )
        except Exception:
            raw_risk_score = (
                academic_risk * 0.40 +
                engagement_risk * 0.35 +
                attendance_risk * 0.15 +
                min(100.0, anomaly_penalty) * 0.10
            )
    else:
        raw_risk_score = (
            academic_risk * 0.40 +
            engagement_risk * 0.35 +
            attendance_risk * 0.15 +
            min(100.0, anomaly_penalty) * 0.10
        )

    risk_score = round(min(100.0, max(0.0, raw_risk_score)), 1)

    # Risk Level mapping
    if risk_score >= 75.0:
        risk_level = "CRITICAL_RISK"
    elif risk_score >= 55.0:
        risk_level = "HIGH_RISK"
    elif risk_score >= 35.0:
        risk_level = "MEDIUM_RISK"
    elif risk_score >= 20.0:
        risk_level = "LOW_RISK"
    else:
        risk_level = "SAFE"

    # Failure / Dropout Probability estimation
    failure_probability = round(min(99.0, risk_score * 0.95), 1)

    # Extract Primary Risk Factor & Contributing Factors
    contributing_factors = []
    recommended_actions = []

    if attendance_pct < 75.0:
        contributing_factors.append(f"Low overall attendance ({round(attendance_pct, 1)}%) below 75% requirement.")
        recommended_actions.append("Issue Attendance Shortage Notice & Schedule Advisor Meeting.")

    if avg_acad_score < 60.0:
        contributing_factors.append(f"Low overall academic performance ({round(avg_acad_score, 1)}/100).")
        recommended_actions.append("Assign Remedial Tutorial Classes in Weak Subjects.")

    if eng_score < 60.0:
        contributing_factors.append(f"Low LMS/Course Engagement score ({round(eng_score, 1)}/100).")
        recommended_actions.append("Faculty Check-in to review LMS portal access.")

    if inactivity_hours >= 48.0:
        contributing_factors.append(f"Prolonged inactivity detected ({round(inactivity_hours, 1)} hours with no LMS activity).")
        recommended_actions.append("Send Automated SMS/Email Academic Check-in Alert.")

    if student.active_backlogs > 0:
        contributing_factors.append(f"Active backlog count: {student.active_backlogs}.")
        recommended_actions.append("Enrol in Special Backlog Preparation Track.")

    if not contributing_factors:
        contributing_factors.append("Good academic standing and consistent LMS engagement.")
        recommended_actions.append("Maintain current academic routine.")

    primary_factor = contributing_factors[0]

    # Save to StudentRiskAssessment DB table
    risk_rec = db.query(models.StudentRiskAssessment).filter(
        models.StudentRiskAssessment.student_id == student.enrollment_no
    ).first()

    if not risk_rec:
        risk_rec = models.StudentRiskAssessment(student_id=student.enrollment_no)
        db.add(risk_rec)

    risk_rec.risk_score = risk_score
    risk_rec.risk_level = risk_level
    risk_rec.failure_probability = failure_probability
    risk_rec.primary_risk_factor = primary_factor
    risk_rec.contributing_factors_json = json.dumps(contributing_factors)
    risk_rec.recommended_actions_json = json.dumps(recommended_actions)
    db.commit()

    return {
        "student_id": student.enrollment_no,
        "name": student.name,
        "branch": student.branch,
        "semester": student.semester,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "failure_probability": failure_probability,
        "primary_risk_factor": primary_factor,
        "contributing_factors": contributing_factors,
        "recommended_actions": recommended_actions,
        "calculated_at": datetime.utcnow().isoformat()
    }
