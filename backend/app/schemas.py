from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime, date
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

class UserBase(BaseModel):
    email: str
    role: UserRole
    linked_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: str
    approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserApprovalRequest(BaseModel):
    user_id: str
    approve: bool

class BulkApprovalRequest(BaseModel):
    user_ids: list[str]

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    redirect_url: str

class GoogleAuth(BaseModel):
    id_token: str
    role: Optional[UserRole] = UserRole.student # Default to student if not specified

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class StudentUpdate(BaseModel):
    attendance: Optional[int] = None
    dsa_score: Optional[int] = None
    ml_score: Optional[int] = None
    qa_score: Optional[int] = None
    projects_score: Optional[int] = None
    mock_interview_score: Optional[int] = None

class TeacherUpdate(BaseModel):
    avg_improvement: Optional[float] = None
    feedback_score: Optional[float] = None
    content_quality_score: Optional[float] = None
    placement_conversion: Optional[float] = None

class StudentCreate(BaseModel):
    student_id: str
    name: str
    attendance: int
    dsa_score: int
    ml_score: int
    qa_score: int
    projects_score: int
    mock_interview_score: int

class TeacherCreate(BaseModel):
    teacher_id: str
    name: str
    subject: str
    avg_improvement: float = 0.0
    feedback_score: float = 0.0
    content_quality_score: float = 0.0
    placement_conversion: float = 0.0

class StudentBulkUpdateItem(BaseModel):
    student_id: str
    attendance: Optional[int] = None
    dsa_score: Optional[int] = None
    ml_score: Optional[int] = None
    qa_score: Optional[int] = None
    projects_score: Optional[int] = None
    mock_interview_score: Optional[int] = None
    fees_paid: Optional[bool] = None
    external_certifications: Optional[int] = None

class TeacherBulkUpdateItem(BaseModel):
    teacher_id: str
    avg_improvement: Optional[float] = None
    feedback_score: Optional[float] = None
    content_quality_score: Optional[float] = None
    placement_conversion: Optional[float] = None

class AttendanceLogCreate(BaseModel):
    student_id: str
    date: date
    status: str # present / absent

class AttendanceDateRequest(BaseModel):
    date: date
    records: list[AttendanceLogCreate]

class LectureBase(BaseModel):
    batch: str
    subject: str
    topic: str
    room: str
    start_time: str
    end_time: str
    date: date # Added date for weekly plan context
    # date is handled by backend logic or not needed in simple view

class UnitBase(BaseModel):
    unit_number: int
    title: str
    status: str
    progress: int
    total_lectures: int
    lectures_completed: int

class NoticeBase(BaseModel):
    title: str
    content: str
    type: str
    date_posted: date

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    batch: str
    due_date: date
    status: str = "Active"

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    batch: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None

class AssignmentResponse(AssignmentBase):
    id: str
    teacher_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    lectures: list[LectureBase]
    weekly_lectures: list[LectureBase]
    units: list[UnitBase]
    notices: list[NoticeBase]
    attendance_marked: bool
    attendance_count: int
    total_students: int
class DatasetUploadResponse(BaseModel):
    id: str
    dataset_type: str
    table_name: str
    batch_id: Optional[str] = None
    row_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True
