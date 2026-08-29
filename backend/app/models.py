from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Integer, Float, Date, Boolean, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import synonym, relationship
import enum
from .db.session import Base

def generate_uuid():
    import uuid
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    role = Column(Enum(UserRole, name="user_role"), nullable=False)
    linked_id = Column(String, nullable=True) 
    approved = Column(Boolean, default=False)
    approved_by = Column(String, ForeignKey("users.user_id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # OTP Verification fields
    otp = Column(String(6), nullable=True)
    otp_expiry = Column(DateTime(timezone=True), nullable=True)
    is_verified = Column(Boolean, default=False)

from .people.models import (
    Student, Faculty, Teacher, FacultyCourseMapping,
    StudentAcademicMapping, UserAccount
)

from .curriculum.models import (
    Program, SemesterTemplate, CourseSlot, Course,
    CurriculumVersion, Batch, AcademicSession, CurriculumAudit
)

class CourseAllocation(Base):
    __tablename__ = "course_allocations"

    allocation_id = Column(String, primary_key=True, default=generate_uuid)
    course_code = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String, nullable=False)
    academic_year = Column(String, nullable=False) # e.g. 2025-26

class AcademicGrade(Base):
    __tablename__ = "academic_grades"

    grade_id = Column(String, primary_key=True, default=generate_uuid)
    enrollment_no = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False)
    student_id = synonym("enrollment_no")
    course_code = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False)
    mid_sem_marks = Column(Float, default=0.0) # out of 30
    end_sem_marks = Column(Float, default=0.0) # out of 70
    internal_marks = Column(Float, default=0.0) # out of 20
    total_marks = Column(Float, default=0.0) # mid + end + internal
    grade_obtained = Column(String, nullable=True) # O, A+, A, B, C, P, F

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    medical_leave = "medical_leave"

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    enrollment_no = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    student_id = synonym("enrollment_no")
    course_code = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AttendanceStatus, name="attendance_status"), nullable=False)

class Lecture(Base):
    __tablename__ = "lectures"
    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=False, index=True) # maps to faculty_id
    course_code = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=True)
    batch = Column(String) # legacy support (e.g. B.Tech-CSE-Sem5)
    subject = Column(String)
    topic = Column(Text)
    room = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    date = Column(Date, index=True)

class Notice(Base):
    __tablename__ = "notices"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String)
    content = Column(Text)
    type = Column(String)
    date_posted = Column(Date, index=True)

class UnitStatus(str, enum.Enum):
    completed = "Completed"
    in_progress = "In Progress"
    pending = "Pending"

class Unit(Base):
    __tablename__ = "units"
    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=False, index=True) # maps to faculty_id
    course_code = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=True)
    unit_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    status = Column(Enum(UnitStatus, name="unit_status"), default=UnitStatus.pending)
    progress = Column(Integer, default=0) # 0-100
    total_lectures = Column(Integer, default=10)
    lectures_completed = Column(Integer, default=0)

class AssignmentStatus(str, enum.Enum):
    active = "Active"
    closed = "Closed"

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=False, index=True) # maps to faculty_id
    course_code = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    batch = Column(String, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AssignmentStatus, name="assignment_status"), default=AssignmentStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(String, primary_key=True, default=generate_uuid)
    assignment_id = Column(String, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True) # maps to enrollment_no
    content = Column(Text)
    score = Column(Integer, nullable=True) # 0-100
    feedback = Column(Text, nullable=True) # Auto-generated feedback
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

class AlertType(str, enum.Enum):
    risk = "risk"
    info = "info"
    success = "success"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=True, index=True) # maps to enrollment_no
    teacher_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=True, index=True) # maps to faculty_id
    message = Column(Text, nullable=False)
    type = Column(Enum(AlertType, name="alert_type"), default=AlertType.info)
    is_read = Column(Boolean, default=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True) # maps to enrollment_no
    assessment_name = Column(String, nullable=False) # e.g., "Assessment 1"
    technical_score = Column(Float, default=0.0)
    verbal_score = Column(Float, default=0.0)
    math_score = Column(Float, default=0.0)
    logic_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    date = Column(Date, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DatasetUpload(Base):
    __tablename__ = "dataset_uploads"

    id = Column(String, primary_key=True, default=generate_uuid)
    dataset_type = Column(Text, nullable=False)
    table_name = Column(Text, nullable=False)
    batch_id = Column(Text, nullable=True)
    row_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RAGLog(Base):
    """Stores historical RAG status updates for trend analysis"""
    __tablename__ = "rag_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True) # maps to enrollment_no
    date = Column(Date, nullable=False, index=True) # Or start_date of the week
    status = Column(String, nullable=False) # Red, Amber, Green
    period_name = Column(String, nullable=True) # e.g. "July 28 - Aug 2"

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    is_super_admin = Column(Boolean, default=False)
    approved = Column(Boolean, default=True)
    approved_by = Column(String, nullable=True) # Could link to another admin ID
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# Course Syllabus Models
from .syllabus.models import (
    SyllabusFile, CourseUnit, CourseTopic,
    CourseOutcome, RecommendedBook
)

# AI-Powered Adaptive Test Models
from .questions.models import (
    Question, QuestionVersion, QuestionOption,
    QuestionSolution, QuestionPaper
)

from .exam.models import (
    Test, TestAssignment, TestAttempt, StudentAnswer
)

class TestActivityLog(Base):
    __tablename__ = "test_activity_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    attempt_id = Column(String, ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False) # started, viewed, answered, tab_switched, fullscreen_exited, submitted, auto_submitted, time_expired
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class StudentTopicPerformance(Base):
    __tablename__ = "student_topic_performance"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True) # maps to enrollment_no
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    total_questions = Column(Integer, default=0)
    correct_questions = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)

class SavedSyllabus(Base):
    __tablename__ = "saved_syllabi"

    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=False, index=True) # maps to faculty_id
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MarksParameter(Base):
    __tablename__ = "marks_parameters"

    id = Column(String, primary_key=True, default=generate_uuid)
    parameter_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    max_marks = Column(Float, nullable=False, default=100.0)
    weightage = Column(Float, nullable=True)
    subject = Column(String, nullable=False)
    semester = Column(String, nullable=True)
    status = Column(String, default="Active") # Active, Inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StudentParameterMark(Base):
    __tablename__ = "student_parameter_marks"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True) # maps to enrollment_no
    parameter_id = Column(String, ForeignKey("marks_parameters.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FacultyFeedback(Base):
    __tablename__ = "faculty_feedback"

    feedback_id = Column(String, primary_key=True, default=generate_uuid)
    faculty_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=False)
    course_code = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False)
    rating_subject_knowledge = Column(Integer, default=5)
    rating_communication = Column(Integer, default=5)
    rating_punctuality = Column(Integer, default=5)
    rating_overall = Column(Integer, default=5)
    comments = Column(Text, nullable=True)

class AcademicMetric(Base):
    __tablename__ = "academic_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True) # maps to enrollment_no
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False, index=True) # maps to course_code
    attendance_score = Column(Float, default=0.0)
    assessment_score = Column(Float, default=0.0)
    assignment_score = Column(Float, default=0.0)
    test_score = Column(Float, default=0.0)
    practical_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    performance_status = Column(String, nullable=True) # EXCELLENT, GOOD, etc.
    trend = Column(String, nullable=True) # STRONGLY_DECLINING, etc.
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AcademicTrend(Base):
    __tablename__ = "academic_trends"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=True, index=True)
    overall_score = Column(Float, default=0.0)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

class AcademicAlert(Base):
    __tablename__ = "academic_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=True, index=True)
    alert_type = Column(String, nullable=False) # attendance, marks, etc.
    severity = Column(String, nullable=False) # HIGH, MEDIUM, LOW
    message = Column(Text, nullable=False)
    trigger_value = Column(Float, nullable=True)
    previous_value = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ActivityType(str, enum.Enum):
    login = "LOGIN"
    course_view = "COURSE_VIEW"
    lecture_view = "LECTURE_VIEW"
    material_view = "MATERIAL_VIEW"
    video_watch = "VIDEO_WATCH"
    pdf_view = "PDF_VIEW"
    note_access = "NOTE_ACCESS"
    assignment_start = "ASSIGNMENT_START"
    assignment_submit = "ASSIGNMENT_SUBMIT"
    quiz_start = "QUIZ_START"
    quiz_complete = "QUIZ_COMPLETE"
    test_start = "TEST_START"
    test_complete = "TEST_COMPLETE"

class StudentActivity(Base):
    __tablename__ = "student_activities"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String, nullable=False, index=True) # ActivityType enum string
    source = Column(String, default="LMS") # LMS, ERP, PORTAL
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="SET NULL"), nullable=True, index=True)
    resource_id = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, default=0) # Duration in seconds
    metadata_json = Column(Text, nullable=True) # JSON string for extra info
    external_event_id = Column(String, nullable=True, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class EngagementMetric(Base):
    __tablename__ = "engagement_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    lms_activity_score = Column(Float, default=0.0)
    resource_score = Column(Float, default=0.0)
    content_completion_score = Column(Float, default=0.0)
    test_participation_score = Column(Float, default=0.0)
    assignment_behaviour_score = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    trend_score = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0) # 0-100
    engagement_status = Column(String, default="MODERATE") # HIGHLY_ENGAGED, ENGAGED, MODERATE, LOW, DISENGAGED
    trend = Column(String, default="STABLE") # STRONGLY_IMPROVING, IMPROVING, STABLE, DECLINING, STRONGLY_DECLINING, INSUFFICIENT_DATA
    inactivity_hours = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class EngagementAlert(Base):
    __tablename__ = "engagement_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="SET NULL"), nullable=True, index=True)
    alert_type = Column(String, nullable=False) # LOW_ENGAGEMENT, PROLONGED_INACTIVITY, MISSED_TESTS, DECLINING_SUBMISSION_BEHAVIOUR, ENGAGEMENT_DECLINE, BEHAVIOUR_ANOMALY
    severity = Column(String, nullable=False) # INFO, WARNING, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    previous_value = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)
    reason = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RiskLevel(str, enum.Enum):
    critical = "CRITICAL_RISK"
    high = "HIGH_RISK"
    medium = "MEDIUM_RISK"
    low = "LOW_RISK"
    safe = "SAFE"

class StudentRiskAssessment(Base):
    __tablename__ = "student_risk_assessments"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    risk_score = Column(Float, default=0.0) # 0-100 (higher = riskier)
    risk_level = Column(String, default="SAFE", index=True) # CRITICAL_RISK, HIGH_RISK, MEDIUM_RISK, LOW_RISK, SAFE
    failure_probability = Column(Float, default=0.0) # Percentage 0-100%
    primary_risk_factor = Column(String, nullable=True)
    contributing_factors_json = Column(Text, nullable=True) # JSON list of reasons
    recommended_actions_json = Column(Text, nullable=True) # JSON list of interventions
    calculated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

class RiskInterventionLog(Base):
    __tablename__ = "risk_interventions"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="SET NULL"), nullable=True, index=True)
    intervention_type = Column(String, nullable=False) # COUNSELING, REMEDIAL_CLASS, PARENT_NOTIF, HOD_REVIEW
    notes = Column(Text, nullable=True)
    status = Column(String, default="OPEN") # OPEN, IN_PROGRESS, RESOLVED
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    academic_risk = Column(Float, default=0.0)
    attendance_risk = Column(Float, default=0.0)
    engagement_risk = Column(Float, default=0.0)
    assessment_risk = Column(Float, default=0.0)
    backlog_risk = Column(Float, default=0.0)
    overall_risk = Column(Float, default=0.0) # 0-100
    risk_level = Column(String, default="VERY_LOW", index=True) # VERY_LOW, LOW, MODERATE, HIGH, CRITICAL
    risk_trend = Column(String, default="STABLE") # STRONGLY_IMPROVING, IMPROVING, STABLE, DECLINING, STRONGLY_DECLINING, INSUFFICIENT_DATA
    risk_status = Column(String, default="CALCULATED") # CALCULATED, INSUFFICIENT_DATA
    calculated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

class RiskHistory(Base):
    __tablename__ = "risk_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    overall_risk = Column(Float, default=0.0)
    risk_level = Column(String, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RiskFeature(Base):
    __tablename__ = "risk_features"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    feature_name = Column(String, nullable=False, index=True)
    feature_value = Column(Float, default=0.0)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="SET NULL"), nullable=True, index=True)
    prediction_type = Column(String, default="FAILURE_RISK")
    probability = Column(Float, default=0.0) # 0-100%
    prediction = Column(String, default="NO") # YES, NO
    confidence = Column(Float, default=1.0)
    model_version = Column(String, default="academic-risk-v1.0")
    feature_version = Column(String, default="v1.0")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RiskReason(Base):
    __tablename__ = "risk_reasons"

    id = Column(String, primary_key=True, default=generate_uuid)
    risk_id = Column(String, ForeignKey("risk_scores.id", ondelete="CASCADE"), nullable=False, index=True)
    feature = Column(String, nullable=False)
    previous_value = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)
    impact = Column(String, default="HIGH") # HIGH, MEDIUM, LOW
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class TeacherFeedback(Base):
    __tablename__ = "teacher_feedback"

    id = Column(String, primary_key=True, default=generate_uuid)
    risk_id = Column(String, ForeignKey("risk_scores.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="SET NULL"), nullable=True, index=True)
    feedback = Column(String, nullable=False) # AI_CORRECT, AI_INCORRECT, NEEDS_REVIEW
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class SubjectMetric(Base):
    __tablename__ = "subject_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False, index=True)
    attendance_pct = Column(Float, default=75.0)
    internal_marks = Column(Float, default=0.0)
    mid_sem_marks = Column(Float, default=0.0)
    end_sem_marks = Column(Float, default=0.0)
    assignment_score = Column(Float, default=0.0)
    quiz_score = Column(Float, default=0.0)
    test_score = Column(Float, default=0.0)
    practical_score = Column(Float, default=0.0)
    concept_mastery = Column(Float, default=70.0)
    overall_subject_score = Column(Float, default=70.0)
    subject_trend = Column(String, default="STABLE") # STRONGLY_IMPROVING, IMPROVING, STABLE, DECLINING, STRONGLY_DECLINING
    subject_risk = Column(String, default="LOW") # SAFE, LOW, MODERATE, HIGH, CRITICAL
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False, index=True)
    chapter = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    concept_name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QuestionConcept(Base):
    __tablename__ = "question_concepts"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, nullable=False, index=True)
    concept_id = Column(String, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StudentConceptMastery(Base):
    __tablename__ = "student_concept_mastery"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    attempts = Column(Integer, default=0)
    correct = Column(Integer, default=0)
    incorrect = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0) # 0-100%
    easy_accuracy = Column(Float, default=0.0)
    medium_accuracy = Column(Float, default=0.0)
    hard_accuracy = Column(Float, default=0.0)
    mastery_score = Column(Float, default=0.0) # 0-100
    mastery_level = Column(String, default="INSUFFICIENT_DATA", index=True) # MASTERED, PROFICIENT, DEVELOPING, WEAK, CRITICAL, INSUFFICIENT_DATA
    trend = Column(String, default="STABLE") # STRONGLY_IMPROVING, IMPROVING, STABLE, DECLINING, STRONGLY_DECLINING, INSUFFICIENT_DATA
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

class QuestionAnalytics(Base):
    __tablename__ = "question_analytics"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, nullable=False, unique=True, index=True)
    attempt_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    average_time_seconds = Column(Float, default=0.0)
    skip_rate = Column(Float, default=0.0)
    expected_difficulty = Column(String, default="MEDIUM") # EASY, MEDIUM, HARD
    calculated_difficulty = Column(String, default="MEDIUM")
    status = Column(String, default="NORMAL") # NORMAL, QUESTION_REVIEW_REQUIRED
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SectionMetric(Base):
    __tablename__ = "section_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    branch = Column(String, nullable=False, index=True)
    semester = Column(Integer, nullable=False, index=True)
    section = Column(String, nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="SET NULL"), nullable=True, index=True)
    student_count = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    average_attendance = Column(Float, default=0.0)
    average_concept_mastery = Column(Float, default=0.0)
    at_risk_count = Column(Integer, default=0)
    weak_concepts_json = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class FacultyMetric(Base):
    __tablename__ = "faculty_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    faculty_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("courses.course_code", ondelete="CASCADE"), nullable=False, index=True)
    student_count = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    average_attendance = Column(Float, default=0.0)
    pass_rate = Column(Float, default=0.0)
    at_risk_count = Column(Integer, default=0)
    teaching_insights_json = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String, primary_key=True, default=generate_uuid)
    target_type = Column(String, nullable=False, index=True) # STUDENT, SUBJECT, CONCEPT, SECTION, FACULTY, DEPARTMENT
    target_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    insight_text = Column(Text, nullable=False)
    impact_level = Column(String, default="MEDIUM") # HIGH, MEDIUM, LOW
    supporting_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class RemedialRecommendation(Base):
    __tablename__ = "remedial_recommendations"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    recommended_test_config_json = Column(Text, nullable=False) # { "easy_count": 10, "medium_count": 10, "hard_count": 5 }
    status = Column(String, default="PENDING") # PENDING, ASSIGNED, COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class IntegrationSource(Base):
    __tablename__ = "integration_sources"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_name = Column(String, nullable=False, unique=True, index=True) # ERP, LMS, EXAM_SYSTEM, ATTENDANCE_SYSTEM
    adapter_type = Column(String, nullable=False) # REST_API, DATABASE, WEBHOOK, SCHEDULED_SYNC
    endpoint_or_dsn = Column(String, nullable=True)
    status = Column(String, default="HEALTHY", index=True) # HEALTHY, DEGRADED, DOWN
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExternalIdMapping(Base):
    __tablename__ = "external_id_mappings"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_system = Column(String, nullable=False, index=True)
    external_id = Column(String, nullable=False, index=True)
    internal_id = Column(String, nullable=False, index=True)
    entity_type = Column(String, nullable=False, index=True) # STUDENT, FACULTY, COURSE
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SyncRun(Base):
    __tablename__ = "sync_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("integration_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="SUCCESS", index=True) # SUCCESS, PARTIAL, FAILED
    records_fetched = Column(Integer, default=0)
    records_processed = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_summary = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    event_type = Column(String, nullable=False, index=True) # STUDENT_CREATED, ATTENDANCE_UPDATED, MARKS_UPDATED, TEST_COMPLETED, RISK_CHANGED, ALERT_CREATED
    source = Column(String, nullable=False)
    entity_id = Column(String, nullable=False, index=True)
    payload_json = Column(Text, nullable=False)
    status = Column(String, default="PROCESSED", index=True) # PROCESSED, FAILED, PENDING
    event_id_hash = Column(String, nullable=False, unique=True, index=True) # For idempotency
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

class FailedSyncRecord(Base):
    __tablename__ = "failed_sync_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_system = Column(String, nullable=False, index=True)
    entity_type = Column(String, nullable=False, index=True)
    external_id = Column(String, nullable=False, index=True)
    payload_json = Column(Text, nullable=False)
    error_message = Column(Text, nullable=False)
    retry_count = Column(Integer, default=0)
    status = Column(String, default="DEAD_LETTER", index=True) # DEAD_LETTER, RESOLVED, PENDING_RETRY
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    last_attempt_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    anomaly_type = Column(String, nullable=False, index=True) # PERFORMANCE_ANOMALY, ATTENDANCE_ANOMALY, ENGAGEMENT_ANOMALY
    target_type = Column(String, nullable=False)
    target_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    z_score = Column(Float, default=0.0)
    impact_score = Column(Float, default=0.0)
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True, index=True)
    role = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    old_value_json = Column(Text, nullable=True)
    new_value_json = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class SyllabusDocument(Base):
    __tablename__ = "syllabus_documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.faculty_id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False) # PDF, IMAGE, TXT
    content_text = Column(Text, nullable=False)
    subject = Column(String, nullable=True, index=True)
    topic = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class QuestionBankItem(Base):
    __tablename__ = "question_bank"

    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, nullable=True, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False, index=True)
    options_json = Column(Text, nullable=True)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty = Column(String, default="Medium", index=True)
    bloom_taxonomy = Column(String, default="Understand", index=True)
    subject = Column(String, nullable=False, index=True)
    topic = Column(String, nullable=False, index=True)
    subtopic = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class ProctoringLog(Base):
    __tablename__ = "proctoring_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    test_id = Column(String, nullable=False, index=True)
    student_id = Column(String, ForeignKey("students.enrollment_no", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    code = Column(String, nullable=True)
    department = Column(String, default="CSE")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class PredefinedQuestion(Base):
    __tablename__ = "predefined_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_text = Column(Text, nullable=False, unique=True)
    category = Column(String, default="General")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)





