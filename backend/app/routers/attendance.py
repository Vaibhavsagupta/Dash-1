from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"]
)

# Admin or Teacher Dependency
def admin_or_teacher(current_user: models.User = Depends(auth.get_current_user_obj)):
    if current_user.role not in [models.UserRole.admin, models.UserRole.teacher]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty access required"
        )
    return current_user

@router.post("/mark")
def mark_attendance(
    data: schemas.AttendanceDateRequest,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    # Parse date
    try:
        record_date = datetime.strptime(data.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # For now, simplest approach: Delete existing records for this date and re-insert
    # Ideally we'd upsert, but this is quicker for the prototype
    db.query(models.AttendanceLog).filter(models.AttendanceLog.date == record_date).delete()
    
    count = 0
    for record in data.records:
        # Validate status enum
        try:
            status_enum = models.AttendanceStatus(record.status)
        except ValueError:
            continue # Skip invalid statuses
            
        new_log = models.AttendanceLog(
            student_id=record.student_id,
            date=record_date,
            status=status_enum
        )
        db.add(new_log)
        count += 1
    
    db.commit()
    return {"message": f"Recorded attendance for {count} students on {record_date}"}

@router.get("/history")
def get_attendance_history(
    date: str,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    try:
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
        
    logs = db.query(models.AttendanceLog).filter(models.AttendanceLog.date == query_date).all()
    
    return logs
