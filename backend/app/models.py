import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Integer, Float, Date, Boolean
from sqlalchemy.sql import func
import enum
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=generate_uuid, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    # linked_id can be a string or UUID depending on the other tables (not yet created). 
    # Storing as string for flexibility now.
    linked_id = Column(String, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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
    fees_paid = Column(Boolean, default=False)
    external_certifications = Column(Integer, default=0)
    
    # Progression Data
    pre_score = Column(Float, default=0.0)
    post_score = Column(Float, default=0.0)
    
    # Detailed Observation Scores (Pre)
    pre_communication = Column(Float, default=0.0)
    pre_engagement = Column(Float, default=0.0)
    pre_subject_knowledge = Column(Float, default=0.0)
    pre_confidence = Column(Float, default=0.0)
    pre_fluency = Column(Float, default=0.0)
    
    # Detailed Observation Scores (Post)
    post_communication = Column(Float, default=0.0)
    post_engagement = Column(Float, default=0.0)
    post_subject_knowledge = Column(Float, default=0.0)
    post_confidence = Column(Float, default=0.0)
    post_fluency = Column(Float, default=0.0)
    
    pre_status = Column(String, nullable=True)
    post_status = Column(String, nullable=True)
    
    rag_status = Column(String, default="Green")

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
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)

class Lecture(Base):
    __tablename__ = "lectures"
    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, nullable=False)
    batch = Column(String)
    subject = Column(String)
    topic = Column(String)
    room = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    date = Column(Date)

class Notice(Base):
    __tablename__ = "notices"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String)
    content = Column(String)
    type = Column(String)
    date_posted = Column(Date)



class UnitStatus(str, enum.Enum):
    completed = "Completed"
    in_progress = "In Progress"
    pending = "Pending"

class Unit(Base):
    __tablename__ = "units"
    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, nullable=False)
    unit_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    status = Column(Enum(UnitStatus), default=UnitStatus.pending)
    progress = Column(Integer, default=0) # 0-100
    total_lectures = Column(Integer, default=10)
    lectures_completed = Column(Integer, default=0)

class AssignmentStatus(str, enum.Enum):
    active = "Active"
    closed = "Closed"

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    batch = Column(String, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(String, primary_key=True, default=generate_uuid)
    assignment_id = Column(String, nullable=False)
    student_id = Column(String, nullable=False)
    content = Column(String)
    # grade fields
    score = Column(Integer, nullable=True) # 0-100
    feedback = Column(String, nullable=True) # Auto-generated feedback
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


class AlertType(str, enum.Enum):
    risk = "risk"
    info = "info"
    success = "success"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=True) 
    teacher_id = Column(String, ForeignKey("teachers.teacher_id"), nullable=True) 
    message = Column(String, nullable=False)
    type = Column(Enum(AlertType), default=AlertType.info)
    is_read = Column(Boolean, default=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
