from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, Optional
import json

from .. import models
from . import risk_explanation_engine, feature_engine, engagement_engine, concept_engine

def dispatch_system_event(
    event_type: str,
    source: str,
    entity_id: str,
    payload: Dict[str, Any],
    db: Session
) -> Dict[str, Any]:
    student_id = entity_id

    # Pipeline Processing
    if event_type in ["MARKS_UPDATED", "ATTENDANCE_UPDATED", "TEST_COMPLETED"]:
        # Recalculate features & risk
        risk_res = risk_explanation_engine.evaluate_and_explain_risk(student_id, db)
        
        # Log Audit Action
        audit = models.AuditLog(
            user_id="SYSTEM_EVENT_BUS",
            role="SYSTEM",
            action=f"DISPATCH_{event_type}",
            entity_type="STUDENT",
            entity_id=student_id,
            new_value_json=json.dumps({"risk_score": risk_res.get("overall_risk")})
        )
        db.add(audit)
        db.commit()

        return {
            "status": "PROCESSED",
            "event_type": event_type,
            "student_id": student_id,
            "risk_score": risk_res.get("overall_risk")
        }

    return {"status": "PROCESSED", "event_type": event_type, "student_id": student_id}

def retry_failed_sync_record(failed_id: str, db: Session) -> Dict[str, Any]:
    failed_rec = db.query(models.FailedSyncRecord).filter(models.FailedSyncRecord.id == failed_id).first()
    if not failed_rec:
        return {"status": "FAILED", "reason": "Failed record not found"}

    failed_rec.retry_count += 1
    failed_rec.status = "RESOLVED"
    db.commit()

    return {"status": "RESOLVED", "failed_id": failed_id, "retry_count": failed_rec.retry_count}
