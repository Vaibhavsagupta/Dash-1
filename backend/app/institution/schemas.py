"""
Pydantic Schemas for Institutional Intelligence Engine API (Phase 9)
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class InstitutionalKPIOutSchema(BaseModel):
    id: str
    kpi_name: str
    category: str
    target_value: float
    current_value: float
    status: str # MET, NEAR_TARGET, BELOW_TARGET

class UniversityCommandCenterResponse(BaseModel):
    institution_name: str
    academic_year: str
    total_students: int
    active_faculty: int
    overall_attendance_pct: float
    overall_pass_rate_pct: float
    co_attainment_pct: float
    average_prs_score: float
    at_risk_students_count: int
    live_kpis: List[InstitutionalKPIOutSchema]
    executive_ai_insights: List[str]

class HODDashboardResponse(BaseModel):
    department_name: str
    program_code: str
    enrolled_students: int
    faculty_count: int
    attendance_pct: float
    co_attainment_pct: float
    at_risk_count: int
    weak_subject_alerts: List[Dict[str, Any]]
    faculty_leaderboard: List[Dict[str, Any]]

class DeanDashboardResponse(BaseModel):
    title: str
    school_name: str
    total_departments: int
    program_comparisons: List[Dict[str, Any]]
    cross_dept_risk_summary: Dict[str, Any]

class CandidateShortlistSchema(BaseModel):
    student_id: str
    student_name: str
    enrollment_no: str
    program_code: str
    prs_score: float
    technical: float
    coding: float
    readiness_tier: str

class PlacementCellResponse(BaseModel):
    total_eligible: int
    product_ready_count: int
    service_ready_count: int
    upskilling_count: int
    average_prs: float
    top_candidate_shortlist: List[CandidateShortlistSchema]

class NBAReportRequestSchema(BaseModel):
    program_code: str = "AI"
    academic_year: str = "2025-2026"

class NAACEvidenceResponse(BaseModel):
    accreditation_body: str
    criterion_code: str
    evidence_title: str
    generated_at: str
    evidence_items: List[Dict[str, Any]]

class ScheduleReportRequestSchema(BaseModel):
    report_name: str
    frequency: str # DAILY, WEEKLY, MONTHLY
    recipient_role: str # HOD, DEAN, DIRECTOR, PLACEMENT
    format: str = "PDF"

class ReportHistoryOutSchema(BaseModel):
    id: str
    report_type: str
    title: str
    file_path: Optional[str]
    generated_at: str

class InstitutionalDigitalTwinResponse(BaseModel):
    university_scenario: str
    action_simulated: str
    predicted_pass_rate_impact: str
    predicted_co_attainment_impact: str
    executive_recommendation: str
