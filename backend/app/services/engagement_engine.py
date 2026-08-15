from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
import json

from .. import models

INACTIVITY_THRESHOLDS = {
    24: "INFO",
    48: "WARNING",
    72: "HIGH",
    168: "CRITICAL"
}

def normalize_activity_event(db: Session, record: dict) -> Optional[models.StudentActivity]:
    student_id = record.get("student_id")
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return None

    ext_id = record.get("external_event_id")
    if ext_id:
        existing = db.query(models.StudentActivity).filter(models.StudentActivity.external_event_id == ext_id).first()
        if existing:
            return existing

    started_at = record.get("started_at")
    if isinstance(started_at, str):
        try:
            started_at = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        except Exception:
            started_at = datetime.utcnow()
    elif not started_at:
        started_at = datetime.utcnow()

    act = models.StudentActivity(
        student_id=student.enrollment_no,
        activity_type=str(record.get("activity_type", "LMS")).upper(),
        source=record.get("source", "LMS"),
        subject_id=record.get("subject_id"),
        resource_id=record.get("resource_id"),
        started_at=started_at,
        duration=record.get("duration", 0),
        metadata_json=json.dumps(record.get("metadata", {})) if isinstance(record.get("metadata"), dict) else record.get("metadata_json"),
        external_event_id=ext_id
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act

def calculate_student_engagement(student_id: str, db: Session) -> dict:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return {"error": "Student not found"}

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    # Fetch 30-day activities
    activities = db.query(models.StudentActivity).filter(
        models.StudentActivity.student_id == student.enrollment_no,
        models.StudentActivity.started_at >= thirty_days_ago
    ).all()

    # 1. LMS Activity Score (20%)
    login_count = sum(1 for a in activities if a.activity_type in ["LOGIN", "LMS"])
    course_views = sum(1 for a in activities if a.activity_type in ["COURSE_VIEW", "LECTURE_VIEW"])
    lms_activity_score = min(100.0, (login_count * 5.0 + course_views * 3.0 + len(activities) * 1.5))
    if not activities:
        lms_activity_score = 75.0 # default baseline for active students

    # 2. Learning Material Usage (15%)
    material_views = sum(1 for a in activities if a.activity_type in ["MATERIAL_VIEW", "PDF_VIEW", "NOTE_ACCESS"])
    resource_score = min(100.0, material_views * 10.0 if material_views > 0 else 70.0)

    # 3. Content/Video Completion (15%)
    video_views = [a for a in activities if a.activity_type == "VIDEO_WATCH"]
    content_completion_score = min(100.0, sum(a.duration for a in video_views) / 60.0 * 5.0 if video_views else 80.0)

    # 4. Test Participation (15%)
    test_starts = sum(1 for a in activities if a.activity_type in ["TEST_START", "QUIZ_START"])
    test_completes = sum(1 for a in activities if a.activity_type in ["TEST_COMPLETE", "QUIZ_COMPLETE"])
    test_participation_score = (test_completes / test_starts * 100.0) if test_starts > 0 else 85.0

    # 5. Assignment Behaviour (15%)
    submits = sum(1 for a in activities if a.activity_type == "ASSIGNMENT_SUBMIT")
    assignment_behaviour_score = min(100.0, submits * 20.0 if submits > 0 else 75.0)

    # 6. Study Consistency (10%)
    active_days_set = set(a.started_at.date() for a in activities if a.started_at)
    consistency_score = min(100.0, (len(active_days_set) / 30.0 * 100.0) if len(active_days_set) > 0 else 60.0)

    # 7. Activity Trend (10%)
    recent_7d_count = sum(1 for a in activities if a.started_at and a.started_at >= seven_days_ago)
    prior_23d_count = len(activities) - recent_7d_count
    expected_7d = (prior_23d_count / 23.0) * 7.0 if prior_23d_count > 0 else 5.0
    trend_score = min(100.0, (recent_7d_count / expected_7d * 75.0) if expected_7d > 0 else 75.0)

    # Weighted Overall Score (0-100)
    overall_engagement = round(
        lms_activity_score * 0.20 +
        resource_score * 0.15 +
        content_completion_score * 0.15 +
        test_participation_score * 0.15 +
        assignment_behaviour_score * 0.15 +
        consistency_score * 0.10 +
        trend_score * 0.10
    , 1)

    # Status mapping
    if overall_engagement >= 90:
        status = "HIGHLY_ENGAGED"
    elif overall_engagement >= 75:
        status = "ENGAGED"
    elif overall_engagement >= 60:
        status = "MODERATE"
    elif overall_engagement >= 40:
        status = "LOW"
    else:
        status = "DISENGAGED"

    # Inactivity hours calculation
    latest_activity = db.query(models.StudentActivity).filter(
        models.StudentActivity.student_id == student.enrollment_no
    ).order_by(models.StudentActivity.started_at.desc()).first()

    inactivity_hours = 0.0
    if latest_activity and latest_activity.started_at:
        delta = datetime.utcnow() - latest_activity.started_at.replace(tzinfo=None)
        inactivity_hours = round(delta.total_seconds() / 3600.0, 1)

    # Trend status
    past_metrics = db.query(models.EngagementMetric).filter(
        models.EngagementMetric.student_id == student.enrollment_no
    ).order_by(models.EngagementMetric.date.desc()).limit(4).all()

    scores_hist = [m.engagement_score for m in reversed(past_metrics)] + [overall_engagement]
    if len(scores_hist) < 3:
        trend_status = "INSUFFICIENT_DATA"
    else:
        diffs = [scores_hist[i] - scores_hist[i-1] for i in range(1, len(scores_hist))]
        avg_diff = sum(diffs) / len(diffs)
        if avg_diff > 3.0:
            trend_status = "STRONGLY_IMPROVING"
        elif avg_diff > 0.5:
            trend_status = "IMPROVING"
        elif avg_diff < -3.0:
            trend_status = "STRONGLY_DECLINING"
        elif avg_diff < -0.5:
            trend_status = "DECLINING"
        else:
            trend_status = "STABLE"

    # Update or insert EngagementMetric for today
    today = date.today()
    metric_record = db.query(models.EngagementMetric).filter(
        models.EngagementMetric.student_id == student.enrollment_no,
        models.EngagementMetric.date == today
    ).first()

    if not metric_record:
        metric_record = models.EngagementMetric(
            student_id=student.enrollment_no,
            date=today
        )
        db.add(metric_record)

    metric_record.lms_activity_score = round(lms_activity_score, 1)
    metric_record.resource_score = round(resource_score, 1)
    metric_record.content_completion_score = round(content_completion_score, 1)
    metric_record.test_participation_score = round(test_participation_score, 1)
    metric_record.assignment_behaviour_score = round(assignment_behaviour_score, 1)
    metric_record.consistency_score = round(consistency_score, 1)
    metric_record.trend_score = round(trend_score, 1)
    metric_record.engagement_score = overall_engagement
    metric_record.engagement_status = status
    metric_record.trend = trend_status
    metric_record.inactivity_hours = inactivity_hours
    db.commit()

    # Trigger inactivity & anomaly detection checks
    detect_behaviour_alerts(student.enrollment_no, overall_engagement, inactivity_hours, db)

    # Load recent alerts
    recent_alerts = db.query(models.EngagementAlert).filter(
        models.EngagementAlert.student_id == student.enrollment_no
    ).order_by(models.EngagementAlert.created_at.desc()).limit(5).all()

    # Load recent activity timeline (last 10 events)
    timeline_query = db.query(models.StudentActivity).filter(
        models.StudentActivity.student_id == student.enrollment_no
    ).order_by(models.StudentActivity.started_at.desc()).limit(10).all()

    timeline = [{
        "id": a.id,
        "activity_type": a.activity_type,
        "source": a.source,
        "subject_id": a.subject_id,
        "started_at": a.started_at.isoformat() if a.started_at else None,
        "duration": a.duration
    } for a in timeline_query]

    return {
        "student_id": student.enrollment_no,
        "engagement_score": overall_engagement,
        "engagement_status": status,
        "trend": trend_status,
        "inactivity_hours": inactivity_hours,
        "component_scores": {
            "lms_activity": round(lms_activity_score, 1),
            "resource_usage": round(resource_score, 1),
            "content_completion": round(content_completion_score, 1),
            "test_participation": round(test_participation_score, 1),
            "assignment_behaviour": round(assignment_behaviour_score, 1),
            "consistency": round(consistency_score, 1)
        },
        "timeline": timeline,
        "alerts": [{
            "id": al.id,
            "alert_type": al.alert_type,
            "severity": al.severity,
            "message": al.message,
            "reason": al.reason,
            "created_at": al.created_at.isoformat()
        } for al in recent_alerts]
    }

def detect_behaviour_alerts(student_id: str, current_score: float, inactivity_hours: float, db: Session):
    # 1. Inactivity Alert Check
    severity = None
    if inactivity_hours >= 168:
        severity = "CRITICAL"
    elif inactivity_hours >= 72:
        severity = "HIGH"
    elif inactivity_hours >= 48:
        severity = "WARNING"
    elif inactivity_hours >= 24:
        severity = "INFO"

    if severity:
        existing = db.query(models.EngagementAlert).filter(
            models.EngagementAlert.student_id == student_id,
            models.EngagementAlert.alert_type == "PROLONGED_INACTIVITY",
            models.EngagementAlert.severity == severity,
            models.EngagementAlert.is_read == False
        ).first()
        if not existing:
            alert = models.EngagementAlert(
                student_id=student_id,
                alert_type="PROLONGED_INACTIVITY",
                severity=severity,
                message=f"No academic activity detected for {round(inactivity_hours, 1)} hours.",
                current_value=inactivity_hours,
                reason=f"Inactivity crossed institutional threshold ({severity})."
            )
            db.add(alert)

    # 2. Score Drop Alert
    past = db.query(models.EngagementMetric).filter(
        models.EngagementMetric.student_id == student_id
    ).order_by(models.EngagementMetric.date.desc()).offset(1).first()

    if past and past.engagement_score - current_score >= 15.0:
        existing = db.query(models.EngagementAlert).filter(
            models.EngagementAlert.student_id == student_id,
            models.EngagementAlert.alert_type == "ENGAGEMENT_DECLINE",
            models.EngagementAlert.is_read == False
        ).first()
        if not existing:
            alert = models.EngagementAlert(
                student_id=student_id,
                alert_type="ENGAGEMENT_DECLINE",
                severity="HIGH",
                message=f"Engagement score dropped significantly from {past.engagement_score} to {current_score}.",
                previous_value=past.engagement_score,
                current_value=current_score,
                reason="Substantial decrease in overall LMS activity and test/assignment participation."
            )
            db.add(alert)

    db.commit()
