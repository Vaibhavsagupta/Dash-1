from pydantic import BaseModel, EmailStr
from typing import Optional, List
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
    role: Optional[UserRole] = UserRole.student

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

# Course Schemas
class CourseBase(BaseModel):
    course_code: str
    course_name: str
    department: str
    credits: int
    semester: int

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    class Config:
        from_attributes = True

# Course Allocation Schemas
class CourseAllocationBase(BaseModel):
    course_code: str
    faculty_id: str
    semester: int
    section: str
    academic_year: str

class CourseAllocationCreate(CourseAllocationBase):
    pass

class CourseAllocationResponse(CourseAllocationBase):
    allocation_id: str

    class Config:
        from_attributes = True

# Academic Grade / Marks Schemas
class AcademicGradeBase(BaseModel):
    enrollment_no: str
    course_code: str
    mid_sem_marks: float = 0.0
    end_sem_marks: float = 0.0
    internal_marks: float = 0.0
    total_marks: float = 0.0
    grade_obtained: Optional[str] = None

class AcademicGradeCreate(AcademicGradeBase):
    pass

class AcademicGradeResponse(AcademicGradeBase):
    grade_id: str

    class Config:
        from_attributes = True

# Faculty Feedback Schemas
class FacultyFeedbackBase(BaseModel):
    faculty_id: str
    course_code: str
    rating_subject_knowledge: int = 5
    rating_communication: int = 5
    rating_punctuality: int = 5
    rating_overall: int = 5
    comments: Optional[str] = None

class FacultyFeedbackCreate(FacultyFeedbackBase):
    pass

class FacultyFeedbackResponse(FacultyFeedbackBase):
    feedback_id: str

    class Config:
        from_attributes = True

# Student Schemas
class StudentBase(BaseModel):
    enrollment_no: str
    scholar_no: Optional[str] = None
    name: str
    email: str
    program: str
    branch: str
    semester: int
    section: str
    cgpa: float = 0.0
    active_backlogs: int = 0
    admission_year: Optional[int] = None
    graduation_year: Optional[int] = None
    identity_proof: Optional[str] = None
    placement_status: str = "Eligible"
    attendance: int = 0
    dsa_score: int = 0
    ml_score: int = 0
    qa_score: int = 0
    projects_score: int = 0
    mock_interview_score: int = 0
    rag_status: str = "Green"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    # Alias support for legacy endpoints
    @property
    def student_id(self) -> str:
        return self.enrollment_no

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    program: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    cgpa: Optional[float] = None
    active_backlogs: Optional[int] = None
    placement_status: Optional[str] = None
    attendance: Optional[int] = None
    dsa_score: Optional[int] = None
    ml_score: Optional[int] = None
    qa_score: Optional[int] = None
    projects_score: Optional[int] = None
    mock_interview_score: Optional[int] = None
    rag_status: Optional[str] = None

class StudentResponse(StudentBase):
    class Config:
        from_attributes = True

class StudentBulkUpdateItem(BaseModel):
    enrollment_no: str
    student_id: Optional[str] = None # Legacy support
    program: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    cgpa: Optional[float] = None
    active_backlogs: Optional[int] = None
    attendance: Optional[int] = None
    dsa_score: Optional[int] = None
    ml_score: Optional[int] = None
    qa_score: Optional[int] = None
    projects_score: Optional[int] = None
    mock_interview_score: Optional[int] = None
    fees_paid: Optional[bool] = None
    external_certifications: Optional[int] = None
    placement_status: Optional[str] = None

# Teacher Schemas
class TeacherBase(BaseModel):
    faculty_id: str
    name: str
    email: str
    department: str
    designation: Optional[str] = None
    teaching_experience: int = 0
    feedback_score: float = 5.0
    subject: Optional[str] = None
    avg_improvement: float = 0.0
    content_quality_score: float = 0.0
    placement_conversion: float = 0.0

    @property
    def teacher_id(self) -> str:
        return self.faculty_id

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    teaching_experience: Optional[int] = None
    feedback_score: Optional[float] = None
    avg_improvement: Optional[float] = None
    content_quality_score: Optional[float] = None
    placement_conversion: Optional[float] = None

class TeacherResponse(TeacherBase):
    class Config:
        from_attributes = True

class TeacherBulkUpdateItem(BaseModel):
    faculty_id: str
    teacher_id: Optional[str] = None # Legacy support
    department: Optional[str] = None
    designation: Optional[str] = None
    teaching_experience: Optional[int] = None
    feedback_score: Optional[float] = None
    avg_improvement: Optional[float] = None
    content_quality_score: Optional[float] = None
    placement_conversion: Optional[float] = None

# Attendance Schemas
class AttendanceLogCreate(BaseModel):
    enrollment_no: Optional[str] = None
    student_id: Optional[str] = None
    course_code: Optional[str] = None
    date: date
    status: str

    @property
    def primary_student_id(self) -> str:
        return self.enrollment_no or self.student_id or "" # present / absent / medical_leave

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
    date: date
    course_code: Optional[str] = None

class UnitBase(BaseModel):
    unit_number: int
    title: str
    status: str
    progress: int
    total_lectures: int
    lectures_completed: int
    course_code: Optional[str] = None

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
    course_code: Optional[str] = None

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
    teacher_id: str # faculty_id
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

# AI Test Module Schemas
class QuestionCreate(BaseModel):
    question_text: str
    question_type: str
    options: Optional[list[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str
    subject: str
    topic: str
    subtopic: Optional[str] = None

class QuestionResponse(QuestionCreate):
    id: str
    test_id: str

    class Config:
        from_attributes = True

class TestCreate(BaseModel):
    name: str
    subject: str
    topic: str
    description: Optional[str] = None
    duration: int
    passing_marks: int
    difficulty: str

class TestResponse(TestCreate):
    id: str
    teacher_id: str
    approved: bool
    created_at: datetime
    questions: Optional[list[QuestionResponse]] = None

    class Config:
        from_attributes = True

class TestAssignmentCreate(BaseModel):
    student_ids: list[str] # enrollment_nos
    start_date: date
    end_date: date
    randomize_questions: bool = False
    randomize_options: bool = False
    allow_retake: bool = False
    show_result_immediately: bool = True
    show_correct_answers: bool = False

class TestAssignmentResponse(BaseModel):
    id: str
    test_id: str
    student_id: str
    assigned_by: str
    start_date: date
    end_date: date
    randomize_questions: bool
    randomize_options: bool
    allow_retake: bool
    show_result_immediately: bool
    show_correct_answers: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class StudentAnswerSubmit(BaseModel):
    question_id: str
    answer_text: Optional[str] = None
    marked_for_review: bool = False

class ActivityLogCreate(BaseModel):
    event_type: str
    details: Optional[str] = None

class SavedSyllabusCreate(BaseModel):
    title: str
    subject: str
    topic: str
    content: str

class SavedSyllabusResponse(SavedSyllabusCreate):
    id: str
    teacher_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class MarksParameterCreate(BaseModel):
    parameter_name: str
    description: Optional[str] = None
    max_marks: float = 100.0
    weightage: Optional[float] = None
    subject: str
    semester: Optional[str] = None
    status: str = "Active"

class MarksParameterResponse(MarksParameterCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class StudentParameterMarkSubmit(BaseModel):
    student_id: str
    score: float

class StudentParameterMarkResponse(BaseModel):
    id: str
    student_id: str
    parameter_id: str
    score: float
    created_at: datetime

    class Config:
        from_attributes = True

# Academic Performance Monitoring Schemas
class SyncAttendanceRecord(BaseModel):
    student_id: str
    course_code: str
    date: date
    status: str

class SyncAttendancePayload(BaseModel):
    records: List[SyncAttendanceRecord]

class SyncAssessmentRecord(BaseModel):
    student_id: str
    course_code: str
    mid_sem_marks: float
    end_sem_marks: float
    internal_marks: float
    grade_obtained: Optional[str] = None

class SyncAssessmentPayload(BaseModel):
    records: List[SyncAssessmentRecord]

class SyncAssignmentRecord(BaseModel):
    student_id: str
    course_code: str
    total_assignments: int
    submitted_assignments: int
    pending_assignments: int
    missed_assignments: int
    late_submissions: int
    on_time_submissions: int

class SyncAssignmentPayload(BaseModel):
    records: List[SyncAssignmentRecord]

class SyncTestRecord(BaseModel):
    student_id: str
    course_code: str
    tests_assigned: int
    tests_attempted: int
    tests_missed: int
    average_score: float
    accuracy: float

class SyncTestPayload(BaseModel):
    records: List[SyncTestRecord]

class AcademicMetricResponse(BaseModel):
    id: str
    student_id: str
    subject_id: str
    attendance_score: float
    assessment_score: float
    assignment_score: float
    test_score: float
    practical_score: float
    overall_score: float
    performance_status: str
    trend: str
    updated_at: datetime

    class Config:
        from_attributes = True

class AcademicAlertResponse(BaseModel):
    id: str
    student_id: str
    subject_id: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    trigger_value: Optional[float] = None
    previous_value: Optional[float] = None
    current_value: Optional[float] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class StudentActivityCreate(BaseModel):
    student_id: str
    activity_type: str
    source: Optional[str] = "LMS"
    subject_id: Optional[str] = None
    resource_id: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = 0
    metadata_json: Optional[str] = None
    external_event_id: Optional[str] = None

class SyncActivityRecord(BaseModel):
    student_id: str
    activity_type: str
    source: Optional[str] = "LMS"
    subject_id: Optional[str] = None
    resource_id: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = 0
    metadata_json: Optional[str] = None
    external_event_id: Optional[str] = None

class SyncActivityPayload(BaseModel):
    records: List[SyncActivityRecord]

class SyncLMSPayload(BaseModel):
    records: List[SyncActivityRecord]

class EngagementMetricResponse(BaseModel):
    id: str
    student_id: str
    date: date
    lms_activity_score: float
    resource_score: float
    content_completion_score: float
    test_participation_score: float
    assignment_behaviour_score: float
    consistency_score: float
    trend_score: float
    engagement_score: float
    engagement_status: str
    trend: str
    inactivity_hours: float
    updated_at: datetime

    class Config:
        from_attributes = True

class EngagementAlertResponse(BaseModel):
    id: str
    student_id: str
    subject_id: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    previous_value: Optional[float] = None
    current_value: Optional[float] = None
    reason: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RiskAssessmentResponse(BaseModel):
    id: str
    student_id: str
    risk_score: float
    risk_level: str
    failure_probability: float
    primary_risk_factor: Optional[str] = None
    contributing_factors: List[str] = []
    recommended_actions: List[str] = []
    calculated_at: datetime

    class Config:
        from_attributes = True

class InterventionCreate(BaseModel):
    student_id: str
    intervention_type: str
    notes: Optional[str] = None

class InterventionResponse(BaseModel):
    id: str
    student_id: str
    faculty_id: Optional[str] = None
    intervention_type: str
    notes: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TeacherFeedbackCreate(BaseModel):
    risk_id: str
    feedback: str # AI_CORRECT, AI_INCORRECT, NEEDS_REVIEW
    comments: Optional[str] = None

class TeacherFeedbackResponse(BaseModel):
    id: str
    risk_id: str
    teacher_id: Optional[str] = None
    feedback: str
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RiskReasonItem(BaseModel):
    feature: str
    previous_value: Optional[float] = None
    current_value: Optional[float] = None
    impact: str
    reason: str

class DetailedRiskScoreResponse(BaseModel):
    student_id: str
    academic_risk: float
    attendance_risk: float
    engagement_risk: float
    assessment_risk: float
    backlog_risk: float
    overall_risk: float
    risk_level: str
    risk_trend: str
    risk_status: str
    reasons: List[RiskReasonItem] = []
    recommended_actions: List[str] = []
    calculated_at: datetime

class SubjectMetricResponse(BaseModel):
    student_id: str
    subject_id: str
    attendance_pct: float
    internal_marks: float
    mid_sem_marks: float
    end_sem_marks: float
    assignment_score: float
    quiz_score: float
    test_score: float
    practical_score: float
    concept_mastery: float
    overall_subject_score: float
    subject_trend: str
    subject_risk: str
    updated_at: datetime

    class Config:
        from_attributes = True

class StudentConceptMasteryResponse(BaseModel):
    concept_id: str
    concept_name: str
    topic: Optional[str] = None
    chapter: Optional[str] = None
    attempts: int
    correct: int
    incorrect: int
    accuracy: float
    easy_accuracy: float
    medium_accuracy: float
    hard_accuracy: float
    mastery_score: float
    mastery_level: str # MASTERED, PROFICIENT, DEVELOPING, WEAK, CRITICAL, INSUFFICIENT_DATA
    trend: str

    class Config:
        from_attributes = True

class QuestionResponseItemPayload(BaseModel):
    student_id: str
    question_id: str
    subject_id: str
    concept_ids: List[str]
    is_correct: bool
    time_taken_seconds: float = 30.0
    difficulty: str = "MEDIUM"

class AIInsightResponse(BaseModel):
    id: str
    target_type: str
    target_id: str
    title: str
    insight_text: str
    impact_level: str
    created_at: datetime

    class Config:
        from_attributes = True

class RemedialGeneratePayload(BaseModel):
    student_id: str
    concept_id: str

class DataHealthResponse(BaseModel):
    erp_status: str
    lms_status: str
    attendance_status: str
    exam_status: str
    last_sync_at: Optional[datetime] = None
    failed_records_count: int = 0
    dead_letter_count: int = 0
    unmapped_students_count: int = 0

class SyncStatusResponse(BaseModel):
    source_name: str
    adapter_type: str
    status: str
    last_sync_at: Optional[datetime] = None

class SystemEventResponse(BaseModel):
    id: str
    event_type: str
    source: str
    entity_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FailedSyncRecordResponse(BaseModel):
    id: str
    source_system: str
    entity_type: str
    external_id: str
    error_message: str
    retry_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class SyllabusDocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    content_text: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionBankItemBase(BaseModel):
    question_text: str
    question_type: str
    options_json: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str = "Medium"
    bloom_taxonomy: str = "Understand"
    subject: str
    topic: str
    subtopic: Optional[str] = None

class QuestionBankItemCreate(QuestionBankItemBase):
    pass

class QuestionBankItemResponse(QuestionBankItemBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProctoringLogCreate(BaseModel):
    test_id: str
    student_id: str
    event_type: str
    details: Optional[str] = None

class SubjectiveGradeRequest(BaseModel):
    question_text: str
    student_answer: str
    correct_answer: str
    max_score: float = 10.0

class SubjectCreate(BaseModel):
    name: str
    code: Optional[str] = None
    department: Optional[str] = "CSE"

class SubjectResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str
    question_type: str = "MCQ"
    options_json: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    subject: Optional[str] = None
    topic: Optional[str] = None
    subtopic: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: str
    test_id: Optional[str] = None

    class Config:
        from_attributes = True

class TestBase(BaseModel):
    name: str
    subject: str
    topic: str
    description: Optional[str] = None
    duration: int = 30
    passing_marks: float = 60.0
    difficulty: str = "Medium"

class TestCreate(TestBase):
    pass

class TestResponse(TestBase):
    id: str
    teacher_id: Optional[str] = None
    approved: bool = False
    created_at: Optional[datetime] = None
    questions: Optional[List[QuestionResponse]] = []

    class Config:
        from_attributes = True

class PredefinedQuestionCreate(BaseModel):
    question_text: str
    category: Optional[str] = "General"

class PredefinedQuestionResponse(BaseModel):
    id: str
    question_text: str
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True





