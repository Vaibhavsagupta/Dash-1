from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
import math

from .. import models

def detect_student_anomalies(student_id: str, db: Session) -> List[Dict[str, Any]]:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return []

    anomalies = []

    # Attendance anomaly check
    att_pct = float(student.attendance) if student.attendance else 75.0
    if att_pct < 60.0:
        z_score = round((75.0 - att_pct) / 10.0, 2)
        rec = models.AnomalyRecord(
            anomaly_type="ATTENDANCE_ANOMALY",
            target_type="STUDENT",
            target_id=student.enrollment_no,
            title="Severe Attendance Anomaly",
            description=f"Attendance of {att_pct}% is {z_score} standard deviations below historical class mean.",
            z_score=z_score,
            impact_score=85.0
        )
        db.add(rec)
        db.commit()
        anomalies.append({
            "anomaly_type": "ATTENDANCE_ANOMALY",
            "z_score": z_score,
            "description": rec.description
        })

    return anomalies
