"""
Pydantic Schemas for Exam Operating System API (Phase 6)
"""

from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class StartExamSchema(BaseModel):
    test_id: str
    student_id: str

class SaveAnswerSchema(BaseModel):
    attempt_id: str
    question_id: str
    answer: str
    code_language: Optional[str] = None
    tab_switch_count: Optional[int] = 0
    fullscreen_violations: Optional[int] = 0

class SubmitExamSchema(BaseModel):
    attempt_id: str
    tab_switch_count: Optional[int] = 0
    fullscreen_violations: Optional[int] = 0

class EvaluateAttemptSchema(BaseModel):
    attempt_id: str

class ExamQuestionPayload(BaseModel):
    id: str
    question_text: str
    question_type: str
    marks: int
    difficulty: str
    bloom_level: str
    options: List[Dict[str, Any]] = []

class StartExamResponse(BaseModel):
    attempt_id: str
    test_id: str
    test_title: str
    course_code: str
    course_name: str
    duration_minutes: int
    total_marks: int
    started_at: str
    questions: List[ExamQuestionPayload]

class SaveAnswerResponse(BaseModel):
    status: str
    attempt_id: str
    question_id: str
    auto_saved_at: str

class StudentResultResponse(BaseModel):
    attempt_id: str
    test_title: str
    student_name: str
    enrollment_no: str
    score: float
    total_marks: int
    percentage: float
    suspicious_score: float
    tab_switches: int
    fullscreen_violations: int
    topic_mastery_impact: List[Dict[str, Any]]
    co_attainment_impact: List[Dict[str, Any]]
    ai_recommendations: List[str]

class ReplayEventItem(BaseModel):
    timestamp: str
    event_type: str # ANSWER_SAVE, OPTION_CHANGE, TAB_SWITCH, FULLSCREEN_EXIT, SUBMIT
    question_id: Optional[str] = None
    question_text: Optional[str] = None
    answer_preview: Optional[str] = None
    details: str

class ReplayTimelineResponse(BaseModel):
    attempt_id: str
    student_name: str
    enrollment_no: str
    test_title: str
    total_duration_minutes: int
    started_at: str
    submitted_at: str
    score: float
    percentage: float
    suspicious_score: float
    events: List[ReplayEventItem]
