"""
SQLAlchemy ORM Models for Student & Faculty Management System (Phase 3)
"""

import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, synonym
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Student(Base):
    __tablename__ = "students"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    enrollment_no = Column(String(50), unique=True, nullable=False, index=True)
    scholar_no = Column(String(50), unique=True, nullable=True, index=True)
    student_id = synonym("enrollment_no")

    full_name = Column(Text, nullable=False)
    name = synonym("full_name")

    gender = Column(String(20), nullable=True)
    dob = Column(Date, nullable=True)
    email = Column(Text, nullable=True, index=True)
    mobile = Column(String(20), nullable=True)
    parent_name = Column(Text, nullable=True)
    parent_mobile = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)
    
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    current_semester = Column(Integer, default=1)
    semester = synonym("current_semester")
    admission_year = Column(Integer, default=2023)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Legacy dashboard metrics bridging fields
    program = Column(String, default="B.Tech")
    branch = Column(String, default="CSE")
    section = Column(String, default="A")
    cgpa = Column(Float, default=0.0)
    active_backlogs = Column(Integer, default=0)
    identity_proof = Column(String, nullable=True)
    attendance = Column(Integer, default=85)
    dsa_score = Column(Integer, default=80)
    ml_score = Column(Integer, default=78)
    qa_score = Column(Integer, default=82)
    projects_score = Column(Integer, default=85)
    mock_interview_score = Column(Integer, default=80)
    rag_status = Column(String, default="Green")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    fees_paid = Column(Boolean, default=True)
    external_certifications = Column(Integer, default=2)
    pre_score = Column(Float, default=70.0)
    post_score = Column(Float, default=88.0)
    pre_communication = Column(Float, default=3.5)
    pre_engagement = Column(Float, default=3.5)
    pre_subject_knowledge = Column(Float, default=3.5)
    pre_confidence = Column(Float, default=3.5)
    pre_fluency = Column(Float, default=3.5)
    pre_remarks = Column(Text, nullable=True)
    pre_status = Column(Text, nullable=True)
    post_communication = Column(Float, default=4.5)
    post_engagement = Column(Float, default=4.5)
    post_subject_knowledge = Column(Float, default=4.5)
    post_confidence = Column(Float, default=4.5)
    post_fluency = Column(Float, default=4.5)
    post_remarks = Column(Text, nullable=True)
    post_status = Column(Text, nullable=True)

    batch = relationship("Batch", backref="students")
    program_rel = relationship("Program", backref="students")
    academic_history = relationship("StudentAcademicMapping", back_populates="student", cascade="all, delete-orphan")
    user_account = relationship("UserAccount", back_populates="student", uselist=False)

class Faculty(Base):
    __tablename__ = "faculty"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    employee_code = Column(String(30), unique=True, nullable=False, index=True)
    teacher_id = synonym("employee_code")
    faculty_id = synonym("employee_code")

    full_name = Column(Text, nullable=False)
    name = synonym("full_name")

    email = Column(Text, unique=True, nullable=False, index=True)
    mobile = Column(String(20), nullable=True)
    designation = Column(Text, default="Assistant Professor")
    department = Column(Text, default="CSE")
    joining_date = Column(Date, nullable=True)
    status = Column(String(20), default="ACTIVE")

    # Legacy dashboard metrics bridging fields
    subject = Column(String, default="CS")
    teaching_experience = Column(Integer, default=5)
    avg_improvement = Column(Float, default=15.0)
    feedback_score = Column(Float, default=4.5)
    content_quality_score = Column(Float, default=4.2)
    placement_conversion = Column(Float, default=20.0)

    course_mappings = relationship("FacultyCourseMapping", back_populates="faculty", cascade="all, delete-orphan")
    user_account = relationship("UserAccount", back_populates="faculty", uselist=False)

Teacher = Faculty

class FacultyCourseMapping(Base):
    __tablename__ = "faculty_course_mapping"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    semester = Column(Integer, nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)

    faculty = relationship("Faculty", back_populates="course_mappings")
    course = relationship("Course", backref="faculty_mappings")
    batch = relationship("Batch", backref="faculty_mappings")
    academic_session = relationship("AcademicSession", backref="faculty_mappings")

class StudentAcademicMapping(Base):
    __tablename__ = "student_academic_mapping"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    semester = Column(Integer, nullable=False)
    promoted = Column(Boolean, default=True)

    student = relationship("Student", back_populates="academic_history")
    program = relationship("Program")
    batch = relationship("Batch")
    academic_session = relationship("AcademicSession")

class UserAccount(Base):
    __tablename__ = "user_accounts"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(Text, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False) # admin, teacher, student
    linked_student = Column(String(36), ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    linked_faculty = Column(String(36), ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)

    student = relationship("Student", back_populates="user_account")
    faculty = relationship("Faculty", back_populates="user_account")
