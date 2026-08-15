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
def admin_or_teacher(current_user: models.User = Depends(auth.get_current_user_obj), db: Session = Depends(database.get_db)):
    if current_user.role not in [models.UserRole.admin, models.UserRole.teacher]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty or Admin access required"
        )
    return current_user

@router.post("/mark")
def mark_attendance(
    data: schemas.AttendanceDateRequest,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    record_date = data.date
    student_ids = [r.primary_student_id for r in data.records if r.primary_student_id]
    
    # Delete existing logs for these students on this date
    if student_ids:
        db.query(models.AttendanceLog).filter(
            models.AttendanceLog.date == record_date,
            models.AttendanceLog.enrollment_no.in_(student_ids)
        ).delete(synchronize_session=False)
    else:
        db.query(models.AttendanceLog).filter(models.AttendanceLog.date == record_date).delete(synchronize_session=False)
    
    count = 0
    for record in data.records:
        sid = record.primary_student_id
        if not sid:
            continue
        
        st_val = str(record.status).strip().lower()
        status_enum = models.AttendanceStatus.present if st_val in ["present", "p", "true"] else models.AttendanceStatus.absent
        
        new_log = models.AttendanceLog(
            enrollment_no=sid,
            date=record_date,
            status=status_enum
        )
        db.add(new_log)
        count += 1
    
    db.commit()
    return {"message": f"Recorded attendance for {count} students on {record_date}"}

@router.get("/history")
def get_attendance_history(
    date: date,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    logs = db.query(models.AttendanceLog).filter(models.AttendanceLog.date == date).all()
    # Normalize dictionary response for frontend compatibility
    result = []
    for l in logs:
        result.append({
            "id": l.id,
            "enrollment_no": l.enrollment_no,
            "student_id": l.enrollment_no,
            "course_code": l.course_code,
            "date": str(l.date),
            "status": l.status.value if hasattr(l.status, 'value') else str(l.status)
        })
    return result
