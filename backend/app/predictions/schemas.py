"""
Pydantic Schemas for Predictive Academic Intelligence Engine API (Phase 8)
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class XAIFactorItem(BaseModel):
    factor_name: str
    impact_level: str # HIGH_NEGATIVE, MEDIUM_NEGATIVE, POSITIVE
    description: str
    contribution_weight: float

class DigitalTwinSimulationItem(BaseModel):
    scenario_title: str
    action_required: str
    predicted_cgpa_change: str
    predicted_risk_change: str

class StudentPredictionResponse(BaseModel):
    student_id: str
    student_name: str
    enrollment_no: str
    overall_risk_score: float # 0 - 100%
    risk_level: str # LOW, MODERATE, HIGH, CRITICAL
    predicted_cgpa: float
    cgpa_confidence: float
    dropout_probability: float
    subject_backlog_forecast: List[Dict[str, Any]]
    explainable_ai_factors: List[XAIFactorItem]
    academic_digital_twin: List[DigitalTwinSimulationItem]

class PlacementReadinessResponse(BaseModel):
    student_id: str
    student_name: str
    enrollment_no: str
    prs_score: float # 0 - 100
    technical: float
    coding: float
    aptitude: float
    communication: float
    projects: float
    readiness_tier: str # TIER_1_PRODUCT_READY, SERVICE_READY, NEEDS_UPKILLING

class BatchPredictionResponse(BaseModel):
    batch_year: int
    program_code: str
    total_students: int
    predicted_pass_rate: float
    predicted_at_risk_count: int
    predicted_average_cgpa: float
    forecast_window: str # 30 - 90 Days

class GenerateInterventionSchema(BaseModel):
    student_id: str

class InterventionOutSchema(BaseModel):
    id: str
    student_id: str
    student_name: str
    intervention_type: str
    priority: str
    action_plan: List[Dict[str, Any]]
    completed: bool
    created_at: str

    class Config:
        from_attributes = True

class HODCommandCenterResponse(BaseModel):
    total_enrolled: int
    critical_risk_count: int
    moderate_risk_count: int
    average_prs_score: float
    batch_cohort_forecasts: List[BatchPredictionResponse]
    at_risk_leaderboard: List[Dict[str, Any]]
