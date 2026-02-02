from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user_obj as get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
)

@router.get("/teacher", response_model=schemas.DashboardStats)
def get_teacher_dashboard_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    teacher_id = current_user.linked_id
    today = date.today()
    
    # Logs for debugging
    print(f"Fetching data for teacher: {teacher_id} on {today}")
    
    # 1. Today's Lectures
    lectures = db.query(models.Lecture).filter(
        models.Lecture.teacher_id == teacher_id,
        models.Lecture.date == today
    ).order_by(models.Lecture.start_time).all()
    
    # 2. Weekly Plan (Lectures for next 7 days, including today)
    next_week = today + timedelta(days=7)
    weekly_lectures = db.query(models.Lecture).filter(
        models.Lecture.teacher_id == teacher_id,
        models.Lecture.date >= today,
        models.Lecture.date <= next_week
    ).order_by(models.Lecture.date, models.Lecture.start_time).all()
    
    # 3. Units Status
    units = db.query(models.Unit).filter(models.Unit.teacher_id == teacher_id).order_by(models.Unit.unit_number).all()

    # 4. Notices (All, order by date desc)
    notices = db.query(models.Notice).order_by(models.Notice.date_posted.desc()).limit(5).all()
    
    # 5. Attendance
    att_logs = db.query(models.AttendanceLog).filter(models.AttendanceLog.date == today).all()
    attendance_marked = len(att_logs) > 0
    
    present_count = 0
    if attendance_marked:
        present_count = sum(1 for log in att_logs if log.status == models.AttendanceStatus.present)
        
    total_students = db.query(models.Student).count()
    
    # If no units exist, maybe return empty list, but we seed them so it should be fine.
    
    return {
        "lectures": lectures,
        "weekly_lectures": weekly_lectures,
        "units": units,
        "notices": notices,
        "attendance_marked": attendance_marked,
        "attendance_count": present_count,
        "total_students": total_students
    }

@router.post("/seed", status_code=201)
def seed_daily_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    seeds data for TODAY so the dashboard looks alive.
    Also seeds Units.
    """
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    teacher_id = current_user.linked_id
    today = date.today()
    
    # Clear existing lectures for today to avoid dupes on re-seed
    # Actually, let's clear all lectures from today onwards to keep it clean for demo
    db.query(models.Lecture).filter(models.Lecture.teacher_id == teacher_id, models.Lecture.date >= today).delete()
    
    # Create Lectures for Today
    lectures = [
        models.Lecture(teacher_id=teacher_id, batch="CS-Year 3 (Batch A)", subject="Intro to Neural Networks", topic="Backpropagation", room="LH-102", start_time="09:30", end_time="11:00", date=today),
        models.Lecture(teacher_id=teacher_id, batch="CS-Year 2 (Batch B)", subject="Data Structures", topic="Binary Trees", room="LH-205", start_time="11:30", end_time="13:00", date=today),
        models.Lecture(teacher_id=teacher_id, batch="CS-Year 4", subject="AI Ethics", topic="Bias in ML Models", room="LH-301", start_time="14:00", end_time="15:30", date=today),
    ]
    
    # FLectures for Next Few Days (Weekly Plan)
    tomorrow = today + timedelta(days=1)
    day_after = today + timedelta(days=2)
    next_mon = today + timedelta(days=3) # Just sequential for demo
    
    weekly_extras = [
        models.Lecture(teacher_id=teacher_id, batch="CS-Year 3", subject="Neural Networks", topic="Gradient Descent Optimization", room="LH-102", start_time="10:00", end_time="11:30", date=tomorrow),
        models.Lecture(teacher_id=teacher_id, batch="CS-Year 2", subject="Data Structures", topic="AVL Trees", room="LH-205", start_time="12:00", end_time="13:30", date=day_after),
        models.Lecture(teacher_id=teacher_id, batch="CS-Year 4", subject="AI Ethics", topic="Fairness Metrics", room="LH-301", start_time="09:00", end_time="10:30", date=next_mon),
    ]
    
    db.add_all(lectures)
    db.add_all(weekly_extras)
    
    # Seed Units if none exist
    if db.query(models.Unit).filter(models.Unit.teacher_id == teacher_id).count() == 0:
        units = [
            models.Unit(teacher_id=teacher_id, unit_number=1, title="Introduction to AI", status=models.UnitStatus.completed, progress=100, total_lectures=8, lectures_completed=8),
            models.Unit(teacher_id=teacher_id, unit_number=2, title="Neural Networks Basics", status=models.UnitStatus.in_progress, progress=65, total_lectures=12, lectures_completed=8),
            models.Unit(teacher_id=teacher_id, unit_number=3, title="Deep Learning Architectures", status=models.UnitStatus.pending, progress=0, total_lectures=15, lectures_completed=0),
            models.Unit(teacher_id=teacher_id, unit_number=4, title="Reinforcement Learning", status=models.UnitStatus.pending, progress=0, total_lectures=10, lectures_completed=0),
            models.Unit(teacher_id=teacher_id, unit_number=5, title="Ethics in AI", status=models.UnitStatus.pending, progress=0, total_lectures=5, lectures_completed=0),
        ]
        db.add_all(units)
    
    # Check if notices exist, if not add some
    if db.query(models.Notice).count() == 0:
        notices = [
            models.Notice(title="Faculty Meeting", content="Mandatory faculty meeting today at 4 PM in the Conference Hall.", type="admin", date_posted=today),
            models.Notice(title="Exam Schedule Release", content="Mid-term exam schedule has been released. Please review.", type="exam", date_posted=today),
            models.Notice(title="Holiday Announcement", content="Institute closed on Friday for National Holiday.", type="event", date_posted=today),
        ]
        db.add_all(notices)
        
    db.commit()
    return {"message": "Daily data and units seeded for today"}
@router.get("/training-agenda")
def get_training_agenda(
    db: Session = Depends(get_db),
):
    # Fetch all lectures from schedule
    lectures = db.query(models.Lecture, models.Teacher.name.label("trainer_name")) \
        .join(models.Teacher, models.Lecture.teacher_id == models.Teacher.teacher_id, isouter=True) \
        .order_by(models.Lecture.date.asc(), models.Lecture.start_time.asc()) \
        .all()
    
    today = date.today()
    agenda = []
    for lect, trainer_name in lectures:
        status = "Upcoming"
        if lect.date < today:
            status = "Completed"
        elif lect.date == today:
            status = "Live"
            
        agenda.append({
            "id": lect.id,
            "title": lect.topic,
            "date": lect.date.isoformat(),
            "trainer": trainer_name or "General Faculty",
            "status": status,
            "time": f"{lect.start_time} - {lect.end_time}",
            "batch": lect.batch
        })
    return agenda
