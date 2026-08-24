"""
FastAPI Router for Institutional Intelligence & Accreditation Command Center (Phase 9)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from .service import InstitutionService
from .schemas import (
    UniversityCommandCenterResponse, HODDashboardResponse, DeanDashboardResponse,
    PlacementCellResponse, NBAReportRequestSchema, NAACEvidenceResponse,
    ScheduleReportRequestSchema, InstitutionalDigitalTwinResponse
)

router = APIRouter(
    prefix="/api",
    tags=["Institutional Intelligence Command Center (IIACC)"]
)

@router.get("/institution/kpis", response_model=UniversityCommandCenterResponse)
def get_university_kpis(db: Session = Depends(get_db)):
    """Fetch University Command Center Live KPIs & Executive AI Insights."""
    try:
        return InstitutionService.get_university_kpis_service(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/institution/hod/{department}", response_model=HODDashboardResponse)
def get_hod_dashboard(department: str, db: Session = Depends(get_db)):
    """Fetch HOD Department Command Center for AI, CSF, or FSD."""
    try:
        return InstitutionService.get_hod_dashboard_service(db, department)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/institution/dean", response_model=DeanDashboardResponse)
def get_dean_dashboard(db: Session = Depends(get_db)):
    """Fetch Executive Dean Cross-Department Benchmarking Dashboard."""
    try:
        return InstitutionService.get_dean_dashboard_service(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/institution/placement", response_model=PlacementCellResponse)
def get_placement_dashboard(db: Session = Depends(get_db)):
    """Fetch Placement Cell Intelligence & Recruiter Candidate Shortlists."""
    try:
        return InstitutionService.get_placement_dashboard_service(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports/nba")
def generate_nba_report(data: NBAReportRequestSchema, db: Session = Depends(get_db)):
    """Generate 1-Click NBA Accreditation PDF & Evidence Package."""
    try:
        return InstitutionService.generate_nba_report_service(db, data.program_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports/naac", response_model=NAACEvidenceResponse)
def generate_naac_evidence(db: Session = Depends(get_db)):
    """Generate 1-Click NAAC A++ Grade Accreditation Evidence Bundle."""
    try:
        return InstitutionService.generate_naac_report_service(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports/schedule")
def schedule_report(data: ScheduleReportRequestSchema, db: Session = Depends(get_db)):
    """Schedule automated recurring PDF/Excel reports."""
    try:
        sch = InstitutionService.schedule_report_service(db, data)
        return {"status": "SUCCESS", "schedule_id": sch.id, "report_name": sch.report_name, "frequency": sch.frequency}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/institution/digital-twin", response_model=InstitutionalDigitalTwinResponse)
def get_institution_digital_twin():
    """Run Institution Digital Twin Scenario Simulator for Director & Deans."""
    try:
        return InstitutionService.get_digital_twin_service()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
