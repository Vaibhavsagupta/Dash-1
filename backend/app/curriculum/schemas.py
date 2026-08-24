"""
Pydantic Schemas for Curriculum OS API & Validation
"""

from pydantic import BaseModel
from typing import List, Optional

class ProgramOut(BaseModel):
    id: int
    code: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True

class SemesterTemplateOut(BaseModel):
    semester: int
    total_marks: int

    class Config:
        from_attributes = True

class CourseOut(BaseModel):
    id: str
    program_id: int
    program_code: str
    semester: int
    slot_id: Optional[int] = None
    slot_code: Optional[str] = None
    course_code: str
    course_name: str
    theory_marks: int
    practical_marks: int
    internal_marks: int
    external_marks: int
    total_marks: int

    class Config:
        from_attributes = True

class ValidationRuleResult(BaseModel):
    rule_name: str
    status: str # "PASS", "FAIL", "WARNING"
    message: str

class SemesterCurriculumOut(BaseModel):
    program: str
    semester: int
    expected_total_marks: int
    calculated_total_marks: int
    subject_count: int
    is_valid: bool
    validation_issues: List[ValidationRuleResult]
    subjects: List[CourseOut]

class CurriculumOverviewItem(BaseModel):
    program_code: str
    program_name: str
    total_semesters: int
    total_curriculum_marks: int
    semester_summaries: List[dict]
