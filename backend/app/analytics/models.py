"""
SQLAlchemy ORM Models for Learning Intelligence Engine (Phase 7)
"""

import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Numeric, PrimaryKeyConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

class StudentTopicMastery(Base):
    __tablename__ = "student_topic_mastery"
    __table_args__ = (
        PrimaryKeyConstraint("student_id", "topic_id"),
        {'extend_existing': True}
    )

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("course_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    mastery_score = Column(Float, default=0.0) # 0 - 100%
    confidence = Column(Float, default=0.0) # 0 - 100%
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("Student", backref="topic_masteries")
    topic = relationship("CourseTopic", backref="student_masteries")

class StudentCOAttainment(Base):
    __tablename__ = "student_co_attainment"
    __table_args__ = (
        PrimaryKeyConstraint("student_id", "co_id"),
        {'extend_existing': True}
    )

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    co_id = Column(String(36), ForeignKey("course_outcomes.id", ondelete="CASCADE"), nullable=False, index=True)
    attainment = Column(Float, default=0.0) # 0 - 100%
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("Student", backref="co_attainments")
    outcome = relationship("CourseOutcome", backref="student_attainments")
