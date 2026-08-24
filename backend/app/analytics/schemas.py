"""
Pydantic Schemas for Learning Intelligence Engine API (Phase 7)
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class TopicMasteryOutItem(BaseModel):
    topic_id: str
    topic_name: str
    unit_number: int
    course_code: str
    mastery_score: float
    confidence: float
    status: str # MASTERED, NEED_PRACTICE, WEAK

class AcademicDNAPayload(BaseModel):
    concept_strength: float
    application_skill: float
    analytical_reasoning: float
    consistency: float
    learning_speed: float
    overall_dna_rating: str

class StudentMasteryResponse(BaseModel):
    student_id: str
    student_name: str
    enrollment_no: str
    program_code: str
    overall_mastery_percentage: float
    academic_dna: AcademicDNAPayload
    topic_masteries: List[TopicMasteryOutItem]

class COAttainmentOutItem(BaseModel):
    co_id: str
    co_code: str
    statement: str
    attainment_percentage: float
    target_threshold: float = 70.0
    status: str # MET, NEAR_TARGET, BELOW_TARGET

class StudentCOResponse(BaseModel):
    student_id: str
    student_name: str
    enrollment_no: str
    course_code: str
    co_attainments: List[COAttainmentOutItem]

class TEIScoreOutResponse(BaseModel):
    faculty_id: str
    faculty_name: str
    department: str
    tei_score: float # 0 - 100
    topic_completion_weight: float
    student_improvement_weight: float
    attendance_weight: float
    co_achievement_weight: float
    engagement_weight: float
    rating: str

class DepartmentAnalyticsResponse(BaseModel):
    department_name: str
    total_students: int
    total_faculty: int
    average_mastery_percentage: float
    average_co_attainment: float
    program_breakdown: List[Dict[str, Any]]

class AIRecommendationOut(BaseModel):
    role: str # STUDENT, TEACHER, HOD
    target_name: str
    recommendation_text: str
    priority: str # HIGH, MEDIUM, LOW
    action_type: str # REVISION, CLASS_REEXPLAIN, ACCREDITATION_ALERT

class AccreditationReportResponse(BaseModel):
    report_title: str
    academic_year: str
    program_code: str
    nba_status: str
    naac_rating: str
    co_attainment_summary: List[Dict[str, Any]]
    faculty_effectiveness_summary: List[Dict[str, Any]]
    generated_at: str
