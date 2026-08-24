"""
SQLAlchemy ORM Models for Institutional Intelligence & Accreditation Command Center (Phase 9)
"""

import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class InstitutionalKPI(Base):
    __tablename__ = "institutional_kpis"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    kpi_name = Column(String(100), nullable=False)
    category = Column(String(50), default="ACADEMIC") # ACADEMIC, ACCREDITATION, PLACEMENT, FACULTY
    formula = Column(Text, nullable=True)
    target_value = Column(Float, default=80.0)
    current_value = Column(Float, default=82.5)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_name = Column(String(100), nullable=False)
    frequency = Column(String(20), default="WEEKLY") # DAILY, WEEKLY, MONTHLY
    recipient_role = Column(String(50), default="HOD") # HOD, DEAN, DIRECTOR, PLACEMENT
    format = Column(String(10), default="PDF") # PDF, EXCEL
    last_sent = Column(DateTime(timezone=True), server_default=func.now())
    active = Column(Boolean, default=True)

class ReportHistory(Base):
    __tablename__ = "report_history"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_type = Column(String(50), nullable=False) # NBA, NAAC, HOD_WEEKLY, DEAN_MONTHLY
    title = Column(String(200), nullable=False)
    file_path = Column(Text, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

class AccreditationEvidence(Base):
    __tablename__ = "accreditation_evidence"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    accreditation_body = Column(String(20), nullable=False) # NBA, NAAC
    criterion_code = Column(String(50), nullable=False) # CRITERIA_3_TEACHING_LEARNING, CRITERIA_4_OUTCOMES
    evidence_title = Column(Text, nullable=False)
    evidence_data = Column(JSON, nullable=False)
    status = Column(String(20), default="VERIFIED") # VERIFIED, DRAFT
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BenchmarkSnapshot(Base):
    __tablename__ = "benchmark_snapshots"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=generate_uuid)
    benchmark_type = Column(String(50), nullable=False) # PROGRAM_VS_PROGRAM, BATCH_VS_BATCH
    entity_a = Column(String(100), nullable=False)
    entity_b = Column(String(100), nullable=False)
    metrics_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
