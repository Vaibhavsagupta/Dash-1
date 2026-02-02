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
    if current_user.role == models.UserRole.admin:
        # Phase 1 Requirement: Only specific admins can fetch data
        allowed_admins = ["admin@college.com", "admin@samatrix.com"]
        if current_user.email not in allowed_admins:
            # Check admins table for approval
            admin_entry = db.query(models.Admin).filter(models.Admin.email == current_user.email).first()
            if not admin_entry or not admin_entry.approved:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Admin not approved or not in allowed list."
                )
    elif current_user.role != models.UserRole.teacher:
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
    record_date = data.date
    
    # Batch Isolation for Teachers
    if user.role == models.UserRole.teacher:
        teacher_id = user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        
        # Verify that all students in data.records belong to one of these batches
        student_ids = [r.student_id for r in data.records]
        count_not_assigned = db.query(models.Student).filter(
            models.Student.student_id.in_(student_ids),
            ~models.Student.batch_id.in_(batch_list)
        ).count()
        
        if count_not_assigned > 0:
            raise HTTPException(status_code=403, detail="Faculty can only mark attendance for students in their assigned batches")
        
        # Only delete records for students in these batches on this date
        db.query(models.AttendanceLog).filter(
            models.AttendanceLog.date == record_date,
            models.AttendanceLog.student_id.in_(student_ids)
        ).delete(synchronize_session=False)
    else:
        # Admin: Delete all for this date
        db.query(models.AttendanceLog).filter(models.AttendanceLog.date == record_date).delete()
    
    count = 0
    for record in data.records:
        try:
            status_enum = models.AttendanceStatus(record.status)
        except ValueError:
            continue
            
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
    date: date,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    query_date = date
    
    query = db.query(models.AttendanceLog).filter(models.AttendanceLog.date == query_date)
    
    if user.role == models.UserRole.teacher:
        teacher_id = user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        
        query = query.join(models.Student, models.AttendanceLog.student_id == models.Student.student_id) \
                     .filter(models.Student.batch_id.in_(batch_list))
        
    logs = query.all()
    return logs
