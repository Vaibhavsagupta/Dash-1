"""
FastAPI Router for Attendance Intelligence Engine (Phase 4)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .service import AttendanceService
from .models import AttendanceAlert
from ..people.models import Student
from .schemas import (
    SessionStartSchema, SessionOutSchema, CheckInSchema, CheckInResponse,
    EndSessionSchema, StudentAttendanceProfileOut, HeatmapDataOut, AlertOutSchema
)

router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance Intelligence Engine"]
)

@router.post("/start-session", response_model=SessionOutSchema)
def start_lecture_session(data: SessionStartSchema, db: Session = Depends(get_db)):
    """
    Launch a live lecture session with discrete topic mapping and generate a 10-minute expiring QR token.
    """
    try:
        return AttendanceService.start_lecture_session(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-in", response_model=CheckInResponse)
def student_qr_check_in(data: CheckInSchema, db: Session = Depends(get_db)):
    """
    Process student QR check-in with proxy scan validation (duplicate checks & device fingerprinting).
    """
    try:
        return AttendanceService.process_check_in(db, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/end-session")
def end_lecture_session(data: EndSessionSchema, db: Session = Depends(get_db)):
    """
    End active lecture session, mark remaining students as ABSENT, recalculate AI Risk Scores, and trigger alerts.
    """
    try:
        return AttendanceService.end_lecture_session(db, data.session_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student/{student_id}", response_model=StudentAttendanceProfileOut)
def get_student_attendance_profile(student_id: str, db: Session = Depends(get_db)):
    """
    Fetch comprehensive attendance metrics for a student including AI Risk Score, Missed Topics, and Academic Replay Timeline.
    """
    try:
        return AttendanceService.get_student_attendance_profile(db, student_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/heatmaps", response_model=HeatmapDataOut)
def get_attendance_heatmaps(db: Session = Depends(get_db)):
    """
    Fetch Topic-wise attendance heatmaps and student monthly attendance calendar heatmaps.
    """
    try:
        return AttendanceService.generate_heatmaps(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=List[AlertOutSchema])
def get_attendance_alerts(db: Session = Depends(get_db)):
    """
    Fetch active warning alerts for low attendance, consecutive absents, and missed high-importance topics.
    """
    alerts = db.query(AttendanceAlert).filter(AttendanceAlert.resolved == False).order_by(AttendanceAlert.created_at.desc()).all()
    out = []
    for a in alerts:
        st = db.query(Student).filter(Student.id == a.student_id).first()
        out.append(AlertOutSchema(
            id=a.id,
            student_id=a.student_id,
            student_name=st.full_name if st else "Student",
            enrollment_no=st.enrollment_no if st else "N/A",
            alert_type=a.alert_type,
            message=a.message,
            created_at=a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "Recently",
            resolved=a.resolved
        ))
    return out
