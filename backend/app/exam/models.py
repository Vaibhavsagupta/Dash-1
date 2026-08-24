"""
SQLAlchemy ORM Models for Exam Operating System (Phase 6)
"""

import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Test(Base):
    __tablename__ = "tests"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(Text, nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True, index=True)

    total_marks = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=180)
    test_type = Column(String(30), default="ENDSEM") # MIDTERM, SESSIONAL, ENDSEM, QUIZ
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="ACTIVE") # SCHEDULED, ACTIVE, COMPLETED

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", backref="exam_tests")
    creator = relationship("Faculty", backref="exam_tests")
    assignments = relationship("TestAssignment", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")

class TestAssignment(Base):
    __tablename__ = "test_assignments"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    test_id = Column(String(36), ForeignKey("tests.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    attempt_limit = Column(Integer, default=1)

    test = relationship("Test", back_populates="assignments")
    student = relationship("Student", backref="test_assignments")

class TestAttempt(Base):
    __tablename__ = "test_attempts"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    test_id = Column(String(36), ForeignKey("tests.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)

    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)

    tab_switch_count = Column(Integer, default=0)
    fullscreen_violations = Column(Integer, default=0)
    suspicious_score = Column(Float, default=0.0)

    test = relationship("Test", back_populates="attempts")
    student = relationship("Student", backref="test_attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")

class StudentAnswer(Base):
    __tablename__ = "student_answers"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attempt_id = Column(String(36), ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)

    answer = Column(Text, nullable=True)
    code_language = Column(String(20), nullable=True) # Python, C, C++, Java
    obtained_marks = Column(Float, default=0.0)
    is_correct = Column(Boolean, default=False)
    ai_feedback = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    attempt = relationship("TestAttempt", back_populates="answers")
    question = relationship("Question", backref="student_answers")
