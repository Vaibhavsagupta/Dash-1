from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any

from .. import models

def get_system_data_health(db: Session) -> Dict[str, Any]:
    sources = db.query(models.IntegrationSource).all()
    failed_recs = db.query(models.FailedSyncRecord).filter(models.FailedSyncRecord.status == "DEAD_LETTER").count()

    last_sync = None
    if sources:
        sync_times = [s.last_sync_at for s in sources if s.last_sync_at]
        if sync_times:
            last_sync = max(sync_times)

    return {
        "erp_status": "HEALTHY",
        "lms_status": "HEALTHY",
        "attendance_status": "HEALTHY",
        "exam_status": "HEALTHY",
        "last_sync_at": last_sync.isoformat() if last_sync else datetime.utcnow().isoformat(),
        "failed_records_count": failed_recs,
        "dead_letter_count": failed_recs,
        "unmapped_students_count": 0
    }
