"""
FastAPI Router for Predictive Academic Intelligence Engine (Phase 8)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from .service import PredictionService
from .schemas import (
    StudentPredictionResponse, PlacementReadinessResponse, BatchPredictionResponse,
    HODCommandCenterResponse, GenerateInterventionSchema, InterventionOutSchema
)

router = APIRouter(
    prefix="/api",
    tags=["Predictive Academic Intelligence Engine (PAIE)"]
)

@router.get("/predictions/student/{student_id}", response_model=StudentPredictionResponse)
def get_student_predictions(student_id: str, db: Session = Depends(get_db)):
    """Fetch 30-90 day Student Risk prediction, Backlog forecast, Explainable AI factors, and Digital Twin simulations."""
    try:
        return PredictionService.get_student_predictions_service(db, student_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions/placement/{student_id}", response_model=PlacementReadinessResponse)
def get_placement_readiness(student_id: str, db: Session = Depends(get_db)):
    """Fetch Placement Readiness Score (PRS) and category breakdown."""
    try:
        return PredictionService.get_placement_readiness_service(db, student_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.get("/predictions/batch/{batch_year}", response_model=BatchPredictionResponse)
def get_batch_predictions(batch_year: int, db: Session = Depends(get_db)):
    """Fetch 30-60 day Batch performance forecast."""
    try:
        return PredictionService.get_batch_predictions_service(db, batch_year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions/department", response_model=HODCommandCenterResponse)
def get_hod_command_center(db: Session = Depends(get_db)):
    """Fetch HOD Command Center metrics and at-risk student leaderboards."""
    try:
        return PredictionService.get_hod_command_center_service(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interventions/generate", response_model=InterventionOutSchema)
def generate_ai_intervention(data: GenerateInterventionSchema, db: Session = Depends(get_db)):
    """Generate prioritized AI Academic Intervention Action Plan for student."""
    try:
        return PredictionService.generate_interventions_service(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.get("/predictions/parent/{student_id}")
def get_parent_early_warning(student_id: str, db: Session = Depends(get_db)):
    """Fetch Parent Early Warning summary card."""
    try:
        pred = PredictionService.get_student_predictions_service(db, student_id)
        return {
            "student_id": pred.student_id,
            "student_name": pred.student_name,
            "enrollment_no": pred.enrollment_no,
            "risk_level": pred.risk_level,
            "risk_score": pred.overall_risk_score,
            "top_warning": pred.explainable_ai_factors[0].description if pred.explainable_ai_factors else "No active warnings.",
            "recommended_action": "Complete Cloud Computing Unit 2 revision and attend practice session.",
            "last_updated": "Today"
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
