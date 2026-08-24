"""
Pydantic Schemas for Student & Faculty Management System API
"""

from pydantic import BaseModel
from typing import List, Optional

class StudentCreateSchema(BaseModel):
    enrollment_no: str
    scholar_no: Optional[str] = None
    full_name: str
    gender: Optional[str] = "Male"
    email: Optional[str] = None
    mobile: Optional[str] = None
    parent_name: Optional[str] = None
    parent_mobile: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    program_code: Optional[str] = "AI"
    batch_year: Optional[int] = 2023
    current_semester: Optional[int] = 1

class StudentOutSchema(BaseModel):
    id: str
    enrollment_no: str
    scholar_no: Optional[str] = None
    full_name: str
    gender: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    parent_name: Optional[str] = None
    parent_mobile: Optional[str] = None
    program_code: str
    batch_year: int
    current_semester: int
    status: str

    class Config:
        from_attributes = True

class FacultyCreateSchema(BaseModel):
    employee_code: str
    full_name: str
    email: str
    mobile: Optional[str] = None
    designation: Optional[str] = "Assistant Professor"
    department: Optional[str] = "CSE"

class FacultyOutSchema(BaseModel):
    id: str
    employee_code: str
    full_name: str
    email: str
    mobile: Optional[str] = None
    designation: str
    department: str
    status: str

    class Config:
        from_attributes = True

class FacultyCourseAssignSchema(BaseModel):
    faculty_id: str
    course_id: str
    batch_year: int
    semester: int
    session_name: Optional[str] = "2025-26"

class FacultyCourseMappingOut(BaseModel):
    id: str
    faculty_id: str
    faculty_name: str
    course_id: str
    course_code: str
    course_name: str
    batch_year: int
    semester: int
    session_name: str

class StudentAcademicHistorySchema(BaseModel):
    session_name: str
    semester: int
    program_code: str
    batch_year: int
    promoted: bool

class StudentProfileResponse(BaseModel):
    student: StudentOutSchema
    parent_name: Optional[str] = None
    parent_mobile: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    academic_history: List[StudentAcademicHistorySchema] = []
    enrolled_courses: List[dict] = []
    assigned_faculty: List[dict] = []

class ImportSummaryResponse(BaseModel):
    total_rows: int
    imported_count: int
    duplicate_count: int
    failed_count: int
    duplicates: List[dict] = []
    failed_rows: List[dict] = []
