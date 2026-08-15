from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any

from .. import models
from . import engagement_engine

def build_student_features(student_id: str, db: Session) -> Dict[str, Any]:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return {"error": "Student not found"}

    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    # 1. Academic Features
    acad_metrics = db.query(models.AcademicMetric).filter(
        models.AcademicMetric.student_id == student.enrollment_no
    ).all()

    current_avg_marks = sum(m.overall_score for m in acad_metrics) / len(acad_metrics) if acad_metrics else 70.0
    assessment_avg = sum(m.assessment_score for m in acad_metrics) / len(acad_metrics) if acad_metrics else 75.0
    cgpa = student.cgpa if student.cgpa else 0.0
    backlog_count = student.active_backlogs if student.active_backlogs else 0

    # Historical Academic Trends (7d and 30d deltas)
    past_30d_trends = db.query(models.AcademicTrend).filter(
        models.AcademicTrend.student_id == student.enrollment_no,
        models.AcademicTrend.subject_id == None,
        models.AcademicTrend.recorded_at >= thirty_days_ago
    ).order_by(models.AcademicTrend.recorded_at.asc()).all()

    marks_change_30d = 0.0
    marks_change_7d = 0.0
    if past_30d_trends:
        marks_change_30d = round(current_avg_marks - past_30d_trends[0].overall_score, 1)
        recent_7d = [t for t in past_30d_trends if t.recorded_at >= seven_days_ago]
        if recent_7d:
            marks_change_7d = round(current_avg_marks - recent_7d[0].overall_score, 1)

    # 2. Attendance Features
    attendance_pct = float(student.attendance) if student.attendance else 75.0
    logs_30d = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.enrollment_no == student.enrollment_no,
        models.AttendanceLog.date >= thirty_days_ago.date()
    ).all()

    total_conducted = len(logs_30d)
    total_absent = sum(1 for l in logs_30d if str(l.status).lower() in ["absent", "absent_leave"])
    absence_freq = round((total_absent / total_conducted * 100.0) if total_conducted > 0 else 0.0, 1)

    # 3. Engagement Features
    eng_data = engagement_engine.calculate_student_engagement(student.enrollment_no, db)
    engagement_score = eng_data.get("engagement_score", 70.0)
    inactive_days = round(eng_data.get("inactivity_hours", 0.0) / 24.0, 1)

    # Historical Engagement Metrics (7d and 30d deltas)
    past_eng = db.query(models.EngagementMetric).filter(
        models.EngagementMetric.student_id == student.enrollment_no,
        models.EngagementMetric.date >= thirty_days_ago.date()
    ).order_by(models.EngagementMetric.date.asc()).all()

    eng_change_30d = 0.0
    eng_change_7d = 0.0
    if past_eng:
        eng_change_30d = round(engagement_score - past_eng[0].engagement_score, 1)
        rec_7d = [e for e in past_eng if e.date >= seven_days_ago.date()]
        if rec_7d:
            eng_change_7d = round(engagement_score - rec_7d[0].engagement_score, 1)

    # 4. Behaviour Features
    activities_30d = db.query(models.StudentActivity).filter(
        models.StudentActivity.student_id == student.enrollment_no,
        models.StudentActivity.started_at >= thirty_days_ago
    ).all()

    test_starts = sum(1 for a in activities_30d if a.activity_type in ["TEST_START", "QUIZ_START"])
    test_completes = sum(1 for a in activities_30d if a.activity_type in ["TEST_COMPLETE", "QUIZ_COMPLETE"])
    missed_tests = max(0, test_starts - test_completes)

    submits = sum(1 for a in activities_30d if a.activity_type == "ASSIGNMENT_SUBMIT")
    assigned = db.query(models.Assignment).count()
    missed_assignments = max(0, min(10, assigned - submits)) if assigned > 0 else 0

    features = {
        "student_id": student.enrollment_no,
        "current_average_marks": current_avg_marks,
        "marks_change_7d": marks_change_7d,
        "marks_change_30d": marks_change_30d,
        "assessment_average": assessment_avg,
        "cgpa": cgpa,
        "backlog_count": backlog_count,
        "attendance_percentage": attendance_pct,
        "absence_frequency": absence_freq,
        "engagement_score": engagement_score,
        "engagement_change_7d": eng_change_7d,
        "engagement_change_30d": eng_change_30d,
        "inactive_days": inactive_days,
        "missed_tests": missed_tests,
        "missed_assignments": missed_assignments,
        "has_sufficient_data": True if (acad_metrics or logs_30d or activities_30d) else False
    }

    # Save features to RiskFeature table
    for f_name, f_val in features.items():
        if isinstance(f_val, (int, float)):
            rf = models.RiskFeature(
                student_id=student.enrollment_no,
                feature_name=f_name,
                feature_value=float(f_val)
            )
            db.add(rf)
    db.commit()

    return features
