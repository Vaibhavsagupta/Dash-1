from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Integer, Float, Date, Boolean, Text
from sqlalchemy.sql import func
import enum
from .database import Base

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

class Student(Base):
    __tablename__ = "students"

    student_id = Column(String, primary_key=True) # S01, S02, etc.
    name = Column(String, nullable=False)
    attendance = Column(Integer, nullable=False)
    dsa_score = Column(Integer, nullable=False)
    ml_score = Column(Integer, nullable=False)
    qa_score = Column(Integer, nullable=False)
    projects_score = Column(Integer, nullable=False)
    mock_interview_score = Column(Integer, nullable=False)
    
    # External Data (Synced from Sheets/HR)
    batch_id = Column(String, nullable=True, index=True)
    fees_paid = Column(Boolean, default=False)
    external_certifications = Column(Integer, default=0)

    # Personal/Academic Details
    branch = Column(String, nullable=True)
    year = Column(String, nullable=True)
    identity_proof = Column(String, nullable=True) # Aadhar/PAN
    
    # Progression Data
    pre_score = Column(Float, default=0.0)
    post_score = Column(Float, default=0.0)
    
    # Detailed Observation Scores (Pre)
    pre_communication = Column(Float, default=0.0)
    pre_engagement = Column(Float, default=0.0)
    pre_subject_knowledge = Column(Float, default=0.0)
    pre_confidence = Column(Float, default=0.0)
    pre_fluency = Column(Float, default=0.0)
    pre_remarks = Column(Text, nullable=True)
    pre_status = Column(Text, nullable=True)
    
    # Detailed Observation Scores (Post)
    post_communication = Column(Float, default=0.0)
    post_engagement = Column(Float, default=0.0)
    post_subject_knowledge = Column(Float, default=0.0)
    post_confidence = Column(Float, default=0.0)
    post_fluency = Column(Float, default=0.0)
    post_remarks = Column(Text, nullable=True)
    post_status = Column(Text, nullable=True)
    
    rag_status = Column(String, default="Green")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id = Column(String, primary_key=True) # T01, T02, etc.
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    avg_improvement = Column(Float, nullable=False) # Store as 18.0 for 18%
    feedback_score = Column(Float, nullable=False)
    content_quality_score = Column(Float, nullable=False)
    placement_conversion = Column(Float, nullable=False)

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AttendanceStatus, name="attendance_status"), nullable=False)

class Lecture(Base):
    __tablename__ = "lectures"
    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, nullable=False, index=True)
    batch = Column(String)
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
    teacher_id = Column(String, nullable=False, index=True)
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
    teacher_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    batch = Column(String, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AssignmentStatus, name="assignment_status"), default=AssignmentStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(String, primary_key=True, default=generate_uuid)
    assignment_id = Column(String, nullable=False, index=True)
    student_id = Column(String, nullable=False, index=True)
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
    student_id = Column(String, ForeignKey("students.student_id"), nullable=True, index=True) 
    teacher_id = Column(String, ForeignKey("teachers.teacher_id"), nullable=True, index=True) 
    message = Column(Text, nullable=False)
    type = Column(Enum(AlertType, name="alert_type"), default=AlertType.info)
    is_read = Column(Boolean, default=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
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
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
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

# AI-Powered Adaptive Test Models
class Test(Base):
    __tablename__ = "tests"

    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.teacher_id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=False) # in minutes
    passing_marks = Column(Integer, nullable=False)
    difficulty = Column(String, nullable=False) # Easy, Medium, Hard
    approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    test_id = Column(String, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False) # MCQ, Multiple Select, True/False, Fill in the Blank, Short Answer
    options = Column(Text, nullable=True) # JSON array of options if applicable
    correct_answer = Column(Text, nullable=False) # string or JSON
    explanation = Column(Text, nullable=True)
    difficulty = Column(String, nullable=False) # Easy, Medium, Hard
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    subtopic = Column(String, nullable=True)

class TestAssignment(Base):
    __tablename__ = "test_assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    test_id = Column(String, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    assigned_by = Column(String, ForeignKey("teachers.teacher_id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    randomize_questions = Column(Boolean, default=False)
    randomize_options = Column(Boolean, default=False)
    allow_retake = Column(Boolean, default=False)
    show_result_immediately = Column(Boolean, default=True)
    show_correct_answers = Column(Boolean, default=False)
    status = Column(String, default="Pending") # Pending, In Progress, Completed, Expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    test_assignment_id = Column(String, ForeignKey("test_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    unanswered_count = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    time_taken = Column(Integer, nullable=True) # in seconds
    tab_switch_count = Column(Integer, default=0)
    fullscreen_exit_count = Column(Integer, default=0)
    auto_submitted = Column(Boolean, default=False)

class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(String, primary_key=True, default=generate_uuid)
    attempt_id = Column(String, ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    answer_text = Column(Text, nullable=True) # Selected/typed answer
    is_correct = Column(Boolean, nullable=True)
    marked_for_review = Column(Boolean, default=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

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
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    total_questions = Column(Integer, default=0)
    correct_questions = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)

class SavedSyllabus(Base):
    __tablename__ = "saved_syllabi"

    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.teacher_id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

