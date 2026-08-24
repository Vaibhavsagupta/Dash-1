"""
Pydantic Schemas for Attendance Intelligence Engine API (Phase 4)
"""

from pydantic import BaseModel
from typing import List, Optional

class SessionStartSchema(BaseModel):
    faculty_id: str
    course_id: str
    batch_year: int
    semester: int
    topic_id: Optional[str] = None
    title: Optional[str] = None
    duration_minutes: Optional[int] = 60

class SessionOutSchema(BaseModel):
    session_id: str
    qr_token: str
    course_code: str
    course_name: str
    topic_name: Optional[str] = None
    faculty_name: str
    batch_year: int
    semester: int
    session_status: str
    expires_in_seconds: int

    class Config:
        from_attributes = True

class CheckInSchema(BaseModel):
    qr_token: str
    student_id: str
    device_fingerprint: Optional[str] = "browser_default"

class CheckInResponse(BaseModel):
    status: str # SUCCESS, DUPLICATE, EXPIRED, REJECTED
    message: str
    student_name: str
    check_in_time: str
    topic_name: Optional[str] = None

class EndSessionSchema(BaseModel):
    session_id: str

class ReplayTimelineItem(BaseModel):
    date: str
    event_type: str # PRESENT, ABSENT, TEST_FAILED, REVISED
    title: str
    topic_name: Optional[str] = None
    unit_number: Optional[int] = None
    impact_summary: str

class StudentAttendanceProfileOut(BaseModel):
    student_id: str
    student_name: str
    enrollment_no: str
    program_code: str
    current_semester: int
    total_lectures: int
    attended_lectures: int
    percentage: float
    risk_score: float
    risk_level: str # LOW, MODERATE, HIGH, CRITICAL
    missed_topics: List[dict] = []
    replay_timeline: List[ReplayTimelineItem] = []

class HeatmapDataOut(BaseModel):
    topic_heatmaps: List[dict] = [] # [{topic_name, unit_number, total_students, attended_students, percentage}]
    student_calendar_heatmaps: List[dict] = [] # [{date, present_count, absent_count}]

class AlertOutSchema(BaseModel):
    id: str
    student_id: str
    student_name: str
    enrollment_no: str
    alert_type: str
    message: str
    created_at: str
    resolved: bool
