"""
SQLAlchemy ORM Models for Syllabus Intelligence Engine (Phase 2)
"""

import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class SyllabusFile(Base):
    __tablename__ = "syllabus_files"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=True, index=True)
    source_type = Column(String(20), default="OFFICIAL", nullable=False) # OFFICIAL or ADDITIONAL
    file_name = Column(Text, nullable=False)
    file_path = Column(Text, nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False, index=True)
    uploaded_by = Column(String(36), nullable=True)
    upload_status = Column(String(20), default="PROCESSED") # PENDING, PROCESSING, PROCESSED, FAILED
    parser_confidence = Column(Numeric(5, 2), default=95.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", backref="syllabus_files")
    units = relationship("CourseUnit", back_populates="syllabus_file", cascade="all, delete-orphan")
    outcomes = relationship("CourseOutcome", back_populates="syllabus_file", cascade="all, delete-orphan")
    books = relationship("RecommendedBook", back_populates="syllabus_file", cascade="all, delete-orphan")

class CourseUnit(Base):
    __tablename__ = "course_units"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    syllabus_file_id = Column(String(36), ForeignKey("syllabus_files.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_number = Column(Integer, nullable=False)
    unit_title = Column(Text, nullable=False)
    teaching_hours = Column(Integer, default=8)
    display_order = Column(Integer, default=1)

    syllabus_file = relationship("SyllabusFile", back_populates="units")
    topics = relationship("CourseTopic", back_populates="unit", cascade="all, delete-orphan")

class CourseTopic(Base):
    __tablename__ = "course_topics"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    unit_id = Column(String(36), ForeignKey("course_units.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_order = Column(Integer, default=1)
    topic_name = Column(Text, nullable=False)
    keywords = Column(Text, nullable=True) # Stored as comma-separated or JSON string
    embedding = Column(Text, nullable=True) # Text vector representation for future semantic search

    unit = relationship("CourseUnit", back_populates="topics")
    outcomes = relationship("CourseOutcome", secondary="topic_co_mapping", back_populates="topics")

class CourseOutcome(Base):
    __tablename__ = "course_outcomes"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    syllabus_file_id = Column(String(36), ForeignKey("syllabus_files.id", ondelete="CASCADE"), nullable=False, index=True)
    co_code = Column(String(10), nullable=False) # e.g. CO1, CO2
    description = Column(Text, nullable=False)

    syllabus_file = relationship("SyllabusFile", back_populates="outcomes")
    topics = relationship("CourseTopic", secondary="topic_co_mapping", back_populates="outcomes")

class TopicCOMapping(Base):
    __tablename__ = "topic_co_mapping"
    __table_args__ = {'extend_existing': True}

    topic_id = Column(String(36), ForeignKey("course_topics.id", ondelete="CASCADE"), primary_key=True)
    outcome_id = Column(String(36), ForeignKey("course_outcomes.id", ondelete="CASCADE"), primary_key=True)

class RecommendedBook(Base):
    __tablename__ = "recommended_books"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    syllabus_file_id = Column(String(36), ForeignKey("syllabus_files.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=False)
    author = Column(Text, nullable=True)
    publisher = Column(Text, nullable=True)

    syllabus_file = relationship("SyllabusFile", back_populates="books")
