"""
FastAPI Router for Exam Operating System (Phase 6)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from .service import ExamService
from .models import Test, TestAttempt
from .schemas import (
    StartExamSchema, SaveAnswerSchema, SubmitExamSchema, EvaluateAttemptSchema,
    StartExamResponse, SaveAnswerResponse, StudentResultResponse, ReplayTimelineResponse
)

router = APIRouter(
    prefix="/api/exam",
    tags=["Exam Operating System (Exam OS)"]
)

@router.post("/start", response_model=StartExamResponse)
def start_exam(data: StartExamSchema, db: Session = Depends(get_db)):
    """Start an interactive Computer-Based Test (CBT) exam session."""
    try:
        return ExamService.start_exam_session(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-answer", response_model=SaveAnswerResponse)
def save_answer(data: SaveAnswerSchema, db: Session = Depends(get_db)):
    """Auto-save student answer every 5 seconds and update anti-cheating violation counts."""
    try:
        return ExamService.auto_save_student_answer(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit", response_model=StudentResultResponse)
def submit_exam(data: SubmitExamSchema, db: Session = Depends(get_db)):
    """
    Submit exam attempt, trigger AI Subjective Rubric Evaluation & Code Sandbox, and execute Automatic Cascade Chain (Topic Mastery -> CO Attainment -> AI Risk Score).
    """
    try:
        return ExamService.submit_and_evaluate_exam(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/replay/{attempt_id}", response_model=ReplayTimelineResponse)
def get_exam_replay(attempt_id: str, db: Session = Depends(get_db)):
    """Fetch step-by-step attempt event replay timeline for teacher dispute review."""
    try:
        return ExamService.get_exam_replay_timeline(db, attempt_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.get("/live-dashboard/{test_id}")
def get_teacher_live_dashboard(test_id: str, db: Session = Depends(get_db)):
    """Fetch real-time proctoring status for active exam."""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail=f"Test ID '{test_id}' not found.")

    attempts = db.query(TestAttempt).filter(TestAttempt.test_id == test.id).all()
    active_count = sum(1 for a in attempts if a.submitted_at is None)
    submitted_count = sum(1 for a in attempts if a.submitted_at is not None)
    suspicious_count = sum(1 for a in attempts if a.suspicious_score > 30.0)

    student_list = []
    for a in attempts:
        student_list.append({
            "attempt_id": a.id,
            "student_name": a.student.full_name if a.student else "Student",
            "enrollment_no": a.student.enrollment_no if a.student else "23BTA001",
            "status": "SUBMITTED" if a.submitted_at else "IN_PROGRESS",
            "tab_switches": a.tab_switch_count,
            "fullscreen_violations": a.fullscreen_violations,
            "suspicious_score": a.suspicious_score,
            "score": a.score,
            "percentage": a.percentage
        })

    return {
        "test_id": test.id,
        "test_title": test.title,
        "course_code": test.course.course_code if test.course else "COURSE",
        "total_assigned": len(attempts),
        "active_students": active_count,
        "submitted_students": submitted_count,
        "suspicious_flags": suspicious_count,
        "students": student_list
    }
