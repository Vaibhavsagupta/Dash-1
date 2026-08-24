"""
SQLAlchemy ORM Models for Attendance Intelligence Engine (Phase 4)
"""

import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, ForeignKey, Text, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class LectureSession(Base):
    __tablename__ = "lecture_sessions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    semester = Column(Integer, nullable=False)
    topic_id = Column(String(36), ForeignKey("course_topics.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(Text, nullable=False)
    lecture_date = Column(Date, default=func.current_date())
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    qr_token = Column(String(100), unique=True, nullable=True, index=True)
    session_status = Column(String(20), default="ACTIVE") # SCHEDULED, ACTIVE, ENDED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    faculty = relationship("Faculty", backref="lecture_sessions")
    course = relationship("Course", backref="lecture_sessions")
    batch = relationship("Batch", backref="lecture_sessions")
    topic = relationship("CourseTopic", backref="lecture_sessions")
    records = relationship("AttendanceRecord", back_populates="lecture_session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lecture_id = Column(String(36), ForeignKey("lecture_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(20), default="PRESENT") # PRESENT, LATE, ABSENT, EXCUSED
    check_in = Column(DateTime(timezone=True), server_default=func.now())
    check_out = Column(DateTime(timezone=True), nullable=True)
    attendance_mode = Column(String(20), default="QR") # QR, MANUAL, FACE, GPS
    confidence_score = Column(Numeric(5, 2), default=100.0)
    device_fingerprint = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lecture_session = relationship("LectureSession", back_populates="records")
    student = relationship("Student", backref="attendance_records")

class AttendanceSummary(Base):
    __tablename__ = "attendance_summary"
    __table_args__ = {'extend_existing': True}

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True, index=True)

    total_classes = Column(Integer, default=0)
    attended = Column(Integer, default=0)
    percentage = Column(Numeric(5, 2), default=0.0)
    risk_score = Column(Numeric(5, 2), default=0.0)

    student = relationship("Student", backref="attendance_summaries")
    course = relationship("Course", backref="attendance_summaries")

class AttendanceAlert(Base):
    __tablename__ = "attendance_alerts"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False) # LOW_ATTENDANCE, CONSECUTIVE_ABSENTS, IMPORTANT_TOPIC_MISSED
    message = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", backref="attendance_alerts")
