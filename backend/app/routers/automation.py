from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, Alert, AlertType, Teacher
from pydantic import BaseModel

router = APIRouter(
    prefix="/automation",
    tags=["automation"]
)

class AutomationResult(BaseModel):
    message: str
    alerts_generated: int

def check_student_risks_task(db: Session):
    """
    Background task to scan all students and generate alerts
    if they fall below certain thresholds.
    """
    students = db.query(Student).all()
    count = 0
    
    # Thresholds
    ATTENDANCE_THRESHOLD = 75
    PRS_THRESHOLD = 60 # Placement Readiness Score - using average of scores as proxy if PRS not stored directly
    
    for student in students:
        # Calculate a simple average score as proxy for PRS if PRS isn't pre-calculated
        # (Assuming PRS is 20% of each component for now, or just simply checking components)
        
        # Risk 1: Attendance
        if student.attendance < ATTENDANCE_THRESHOLD:
            # Check if alert already exists for today to avoid spam? 
            # For simplicity, we just create one if not recently created.
            # actually, just create it.
            
            alert = Alert(
                student_id=student.student_id,
                message=f"Low Attendance Risk: {student.name} is at {student.attendance}%",
                type=AlertType.risk
            )
            db.add(alert)
            count += 1
            
        # Risk 2: Performance
        # Simple average of technical scores
        avg_score = (student.dsa_score + student.ml_score + student.qa_score) / 3
        if avg_score < PRS_THRESHOLD:
            alert = Alert(
                student_id=student.student_id,
                message=f"Performance Risk: {student.name} has low average score ({int(avg_score)}%)",
                type=AlertType.risk
            )
            db.add(alert)
            count += 1
            
    db.commit()
    print(f"Automation Run: Generated {count} alerts.")

from .. import auth, models

@router.post("/run-checks", response_model=AutomationResult)
def trigger_automation_checks(background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    """
    Manually trigger the automated risk analysis. Restricted to Admins.
    """
    background_tasks.add_task(check_student_risks_task, db)
    return {"message": "Automation checks triggered in background", "alerts_generated": 0}

@router.get("/alerts")
def get_alerts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    """
    Fetch alerts with role-based isolation.
    """
    query = db.query(models.Alert)
    
    if current_user.role == models.UserRole.teacher:
        teacher_id = current_user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        
        query = query.join(models.Student, models.Alert.student_id == models.Student.student_id) \
                     .filter(models.Student.batch_id.in_(batch_list))
    elif current_user.role == models.UserRole.student:
        query = query.filter(models.Alert.student_id == current_user.linked_id)
        
    alerts = query.order_by(models.Alert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts
