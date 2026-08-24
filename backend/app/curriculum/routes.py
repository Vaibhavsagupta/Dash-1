"""
FastAPI Router for Curriculum OS
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .service import CurriculumService
from .schemas import SemesterCurriculumOut, CurriculumOverviewItem

router = APIRouter(
    prefix="/api/curriculum",
    tags=["Curriculum OS"]
)

@router.get("/programs", response_model=List[str])
def get_programs(db: Session = Depends(get_db)):
    """Fetch list of all active program codes (e.g. AI, CSF, FSD)."""
    return CurriculumService.get_programs(db)

@router.get("/semesters", response_model=List[int])
def get_semesters(db: Session = Depends(get_db)):
    """Fetch list of all curriculum semesters (1 to 8)."""
    return CurriculumService.get_semesters(db)

@router.get("/overview", response_model=List[CurriculumOverviewItem])
def get_curriculum_overview(db: Session = Depends(get_db)):
    """Fetch complete high-level overview of curriculum structure across all programs and semesters."""
    return CurriculumService.get_curriculum_overview(db)

@router.get("/validate/{program}/{semester}")
def validate_curriculum(program: str, semester: int, db: Session = Depends(get_db)):
    """Run automated validation rules (duplicate code, wrong semester, marks mismatch, missing DSE)."""
    try:
        is_valid, issues, expected_marks, calculated_marks = CurriculumService.validate_curriculum(db, program, semester)
        return {
            "program": program.upper(),
            "semester": semester,
            "is_valid": is_valid,
            "expected_marks": expected_marks,
            "calculated_marks": calculated_marks,
            "issues": [i.dict() for i in issues]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{program}/{semester}", response_model=SemesterCurriculumOut)
def get_curriculum_for_program_semester(program: str, semester: int, db: Session = Depends(get_db)):
    """Fetch detailed curriculum breakdown, subject list, and validation results for a specific program and semester."""
    if semester < 1 or semester > 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8.")
    try:
        return CurriculumService.get_curriculum_for_program_sem(db, program, semester)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
