"""
SQLAlchemy ORM Models for AI Question Intelligence Engine (Phase 5)
"""

import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Question(Base):
    __tablename__ = "questions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("course_topics.id", ondelete="SET NULL"), nullable=True, index=True)
    co_id = Column(String(36), ForeignKey("course_outcomes.id", ondelete="SET NULL"), nullable=True, index=True)
    unit_id = Column(String(36), ForeignKey("course_units.id", ondelete="SET NULL"), nullable=True, index=True)

    question_text = Column(Text, nullable=False)
    question_type = Column(String(30), default="SHORT") # MCQ, SHORT, LONG, NUMERICAL
    difficulty = Column(String(20), default="Medium") # Easy, Medium, Hard
    bloom_level = Column(String(30), default="Understand") # Remember, Understand, Apply, Analyze, Evaluate, Create
    marks = Column(Integer, default=5)
    language = Column(String(20), default="English")
    source_type = Column(String(20), default="OFFICIAL") # OFFICIAL, ADDITIONAL
    ai_generated = Column(Boolean, default=True)
    status = Column(String(20), default="PENDING_REVIEW") # PENDING_REVIEW, APPROVED, REJECTED
    version = Column(Integer, default=1)
    embedding_str = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", backref="questions")
    topic = relationship("CourseTopic", backref="questions")
    outcome = relationship("CourseOutcome", backref="questions")
    unit = relationship("CourseUnit", backref="questions")

    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    solution = relationship("QuestionSolution", back_populates="question", uselist=False, cascade="all, delete-orphan")
    versions = relationship("QuestionVersion", back_populates="question", cascade="all, delete-orphan")

class QuestionVersion(Base):
    __tablename__ = "question_versions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    modified_by = Column(String(36), nullable=True)
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("Question", back_populates="versions")

class QuestionOption(Base):
    __tablename__ = "question_options"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_key = Column(String(10), nullable=False) # A, B, C, D
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="options")

class QuestionSolution(Base):
    __tablename__ = "question_solutions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    solution_text = Column(Text, nullable=False)
    stepwise_explanation = Column(Text, nullable=True)
    references_text = Column(Text, nullable=True)

    question = relationship("Question", back_populates="solution")

class QuestionPaper(Base):
    __tablename__ = "question_papers"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(Text, nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    semester = Column(Integer, nullable=False)
    total_marks = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=180)
    template_type = Column(String(30), default="EndSem") # Midterm, Sessional, EndSem, Quiz, Practice
    paper_structure = Column(JSON, nullable=False)
    created_by = Column(String(36), ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", backref="question_papers")
    batch = relationship("Batch", backref="question_papers")
    creator = relationship("Faculty", backref="question_papers")
