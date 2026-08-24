"""
Pydantic Schemas for AI Question Intelligence Engine API (Phase 5)
"""

from pydantic import BaseModel
from typing import List, Optional, Any

class OptionCreateSchema(BaseModel):
    option_key: str
    option_text: str
    is_correct: bool = False

class QuestionGenerateSchema(BaseModel):
    course_id: str
    unit_id: Optional[str] = None
    topic_id: Optional[str] = None
    co_id: Optional[str] = None
    question_type: Optional[str] = "SHORT" # MCQ, SHORT, LONG, NUMERICAL
    bloom_level: Optional[str] = "Understand" # Remember, Understand, Apply, Analyze, Evaluate, Create
    difficulty: Optional[str] = "Medium" # Easy, Medium, Hard
    marks: Optional[int] = 5
    count: Optional[int] = 3
    source_type: Optional[str] = "OFFICIAL"

class QuestionOptionOut(BaseModel):
    id: str
    option_key: str
    option_text: str
    is_correct: bool

    class Config:
        from_attributes = True

class QuestionSolutionOut(BaseModel):
    solution_text: str
    stepwise_explanation: Optional[str] = None
    references_text: Optional[str] = None

    class Config:
        from_attributes = True

class QuestionOutSchema(BaseModel):
    id: str
    course_id: str
    course_code: str
    topic_name: Optional[str] = None
    unit_number: Optional[int] = None
    co_code: Optional[str] = None
    question_text: str
    question_type: str
    difficulty: str
    bloom_level: str
    marks: int
    language: str
    source_type: str
    ai_generated: bool
    status: str
    version: int
    quality_score: Optional[float] = 95.0
    options: List[QuestionOptionOut] = []
    solution: Optional[QuestionSolutionOut] = None

    class Config:
        from_attributes = True

class QuestionReviewSchema(BaseModel):
    question_id: str
    action: str # ACCEPT, EDIT, REJECT
    edited_text: Optional[str] = None
    edited_marks: Optional[int] = None
    teacher_id: Optional[str] = None

class PaperSectionRule(BaseModel):
    section_title: str # e.g. Section A: Multiple Choice Questions
    question_type: str # MCQ, SHORT, LONG
    count: int
    marks_per_question: int

class PaperBuildSchema(BaseModel):
    title: str
    course_id: str
    batch_year: int
    semester: int
    template_type: str # Midterm, Sessional, EndSem, Quiz, Practice
    faculty_id: Optional[str] = None
    custom_sections: Optional[List[PaperSectionRule]] = None

class PaperOutSchema(BaseModel):
    id: str
    title: str
    course_code: str
    course_name: str
    batch_year: int
    semester: int
    total_marks: int
    duration_minutes: int
    template_type: str
    sections: List[Any]
    bloom_distribution: dict
    co_distribution: dict
    created_at: str

    class Config:
        from_attributes = True
