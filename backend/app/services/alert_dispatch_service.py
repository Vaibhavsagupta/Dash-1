from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
import json
import logging

from .. import models
from . import risk_engine

logger = logging.getLogger(__name__)

def scan_and_dispatch_risk_alerts(db: Session) -> Dict[str, Any]:
    """
    Scans all enrolled students, identifies HIGH and CRITICAL risk students,
    generates system alert entries, and dispatches automated notifications.
    """
    students = db.query(models.Student).all()
    dispatched_alerts = []
    skipped_count = 0

    for student in students:
        risk_data = risk_engine.calculate_student_risk(student.enrollment_no, db)
        risk_status = risk_data.get("risk_status", "SAFE")
        risk_score = risk_data.get("risk_score", 0.0)

        if risk_status in ["HIGH", "CRITICAL", "Red", "Amber"]:
            # Check if alert already exists today to prevent duplicate spamming
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            existing = db.query(models.RiskAlert).filter(
                models.RiskAlert.student_id == student.enrollment_no,
                models.RiskAlert.created_at.like(f"{today_str}%")
            ).first()

            message = (
                f"ALERT: Student {student.name} ({student.enrollment_no}) flagged with "
                f"{risk_status} Risk Level (Score: {risk_score}%). "
                f"Attendance: {student.attendance or 0}%, CGPA: {student.cgpa or 0.0}."
            )

            if not existing:
                alert_entry = models.RiskAlert(
                    student_id=student.enrollment_no,
                    severity="CRITICAL" if risk_status in ["CRITICAL", "Red"] else "WARNING",
                    message=message,
                    status="UNACKNOWLEDGED",
                    created_at=datetime.utcnow()
                )
                db.add(alert_entry)
                db.flush()

            # Simulated Automated Email/Notification Dispatch Log
            dispatched_alerts.append({
                "student_id": student.enrollment_no,
                "student_name": student.name,
                "email": student.email,
                "risk_status": risk_status,
                "risk_score": risk_score,
                "message": message,
                "dispatched_at": datetime.utcnow().isoformat()
            })
        else:
            skipped_count += 1

    db.commit()

    logger.info(f"[Alert Dispatch] Scanned {len(students)} students. Dispatched {len(dispatched_alerts)} alerts.")

    return {
        "status": "success",
        "total_scanned": len(students),
        "dispatched_count": len(dispatched_alerts),
        "skipped_safe_count": skipped_count,
        "dispatched_alerts": dispatched_alerts
    }
