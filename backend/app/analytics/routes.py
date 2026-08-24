"""
FastAPI Router for Learning Intelligence Engine (Phase 7)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .service import AnalyticsService
from .schemas import (
    StudentMasteryResponse, StudentCOResponse, TEIScoreOutResponse,
    DepartmentAnalyticsResponse, AIRecommendationOut, AccreditationReportResponse
)

router = APIRouter(
    prefix="/api",
    tags=["Learning Intelligence Engine (LIE)"]
)

@router.get("/analytics/student/{student_id}/mastery", response_model=StudentMasteryResponse)
def get_student_topic_mastery(student_id: str, db: Session = Depends(get_db)):
    """Fetch student live Topic Mastery breakdown & Academic DNA Knowledge Graph."""
    try:
        return AnalyticsService.get_student_topic_mastery_service(db, student_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/student/{student_id}/co", response_model=StudentCOResponse)
def get_student_co_attainment(student_id: str, db: Session = Depends(get_db)):
    """Fetch student Course Outcome (CO1-CO4) attainment percentages against target thresholds."""
    try:
        return AnalyticsService.get_student_co_attainment_service(db, student_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.get("/analytics/faculty/{faculty_id}", response_model=TEIScoreOutResponse)
def get_faculty_tei(faculty_id: str, db: Session = Depends(get_db)):
    """Fetch Teacher Effectiveness Intelligence (TEI) score & metrics."""
    try:
        return AnalyticsService.get_faculty_tei_service(db, faculty_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/department", response_model=DepartmentAnalyticsResponse)
def get_department_analytics(db: Session = Depends(get_db)):
    """Fetch HOD department-wide analytics across AI, CSF, and FSD specializations."""
    try:
        return AnalyticsService.get_department_analytics_service(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/student/{student_id}", response_model=List[AIRecommendationOut])
def get_ai_recommendations(student_id: str, db: Session = Depends(get_db)):
    """Fetch role-targeted AI Recommendations & Personalized Learning Paths for Students, Teachers, and HODs."""
    try:
        return AnalyticsService.generate_ai_recommendations_service(db, student_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/accreditation", response_model=AccreditationReportResponse)
def get_accreditation_report(db: Session = Depends(get_db)):
    """Generate 1-click NBA & NAAC Accreditation Summary Report."""
    try:
        return AnalyticsService.generate_accreditation_report_service(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
