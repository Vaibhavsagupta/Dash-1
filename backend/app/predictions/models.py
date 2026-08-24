"""
SQLAlchemy ORM Models for Predictive Academic Intelligence Engine (Phase 8)
"""

import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class PredictionSnapshot(Base):
    __tablename__ = "prediction_snapshots"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_type = Column(String(50), nullable=False) # RISK, CGPA, PLACEMENT, DROPOUT, BACKLOG
    score = Column(Float, default=0.0)
    confidence = Column(Float, default=90.0)
    reasons_json = Column(JSON, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", backref="prediction_snapshots")
    interventions = relationship("Intervention", back_populates="prediction", cascade="all, delete-orphan")

class Intervention(Base):
    __tablename__ = "interventions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(String(36), ForeignKey("prediction_snapshots.id", ondelete="SET NULL"), nullable=True, index=True)

    intervention_type = Column(String(50), default="REMEDIAL_PRACTICE")
    priority = Column(String(20), default="HIGH") # HIGH, MEDIUM, LOW
    action_plan = Column(JSON, nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", backref="interventions")
    prediction = relationship("PredictionSnapshot", back_populates="interventions")

class PlacementReadiness(Base):
    __tablename__ = "placement_readiness"
    __table_args__ = {'extend_existing': True}

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    score = Column(Float, default=0.0) # 0 - 100
    technical = Column(Float, default=75.0)
    coding = Column(Float, default=70.0)
    aptitude = Column(Float, default=80.0)
    communication = Column(Float, default=85.0)
    projects = Column(Float, default=75.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("Student", backref="placement_readiness", uselist=False)
