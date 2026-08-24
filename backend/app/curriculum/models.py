"""
SQLAlchemy ORM Models for Curriculum OS
"""

import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Text, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Program(Base):
    __tablename__ = "programs"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)

    courses = relationship("Course", back_populates="program")
    curriculum_versions = relationship("CurriculumVersion", back_populates="program")

class SemesterTemplate(Base):
    __tablename__ = "semester_templates"
    __table_args__ = {'extend_existing': True}

    semester = Column(Integer, primary_key=True, index=True)
    total_marks = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course_slots = relationship("CourseSlot", back_populates="semester_template")
    courses = relationship("Course", back_populates="semester_template")

class CourseSlot(Base):
    __tablename__ = "course_slots"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    semester = Column(Integer, ForeignKey("semester_templates.semester"), nullable=False)
    slot_code = Column(String(30), nullable=False)
    slot_name = Column(Text, nullable=False)
    slot_type = Column(String(50), nullable=True)
    max_marks = Column(Integer, nullable=True)
    is_specialization = Column(Boolean, default=False)
    is_generic_elective = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)

    semester_template = relationship("SemesterTemplate", back_populates="course_slots")
    courses = relationship("Course", back_populates="slot")

class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint('program_id', 'semester', 'course_code', name='uq_program_sem_course_code'),
        {'extend_existing': True}
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    semester = Column(Integer, ForeignKey("semester_templates.semester"), nullable=False)
    slot_id = Column(Integer, ForeignKey("course_slots.id"), nullable=True)
    course_code = Column(String(30), nullable=False)
    course_name = Column(Text, nullable=False)
    theory_marks = Column(Integer, default=0)
    practical_marks = Column(Integer, default=0)
    internal_marks = Column(Integer, default=0)
    external_marks = Column(Integer, default=0)

    program = relationship("Program", back_populates="courses")
    semester_template = relationship("SemesterTemplate", back_populates="courses")
    slot = relationship("CourseSlot", back_populates="courses")

class CurriculumVersion(Base):
    __tablename__ = "curriculum_versions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(20), nullable=True)
    version_no = Column(Integer, default=1)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    program = relationship("Program", back_populates="curriculum_versions")

class Batch(Base):
    __tablename__ = "batches"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    batch_year = Column(Integer, unique=True, nullable=False)

class AcademicSession(Base):
    __tablename__ = "academic_sessions"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    session_name = Column(String(20), nullable=False)
    is_current = Column(Boolean, default=False)

class CurriculumAudit(Base):
    __tablename__ = "curriculum_audit"
    __table_args__ = {'extend_existing': True}

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    action = Column(String(50), nullable=False)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Text, nullable=True)
    performed_by = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
