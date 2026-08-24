-- =========================================================
-- Curriculum OS Phase 8 — Predictive Academic Intelligence Engine (PAIE)
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: prediction_snapshots
CREATE TABLE IF NOT EXISTS prediction_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL,
    score NUMERIC(5,2) DEFAULT 0.0,
    confidence NUMERIC(5,2) DEFAULT 90.0,
    reasons_json JSONB,
    generated_at TIMESTAMP DEFAULT now()
);

-- 2. Table: interventions
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES prediction_snapshots(id) ON DELETE SET NULL,
    intervention_type VARCHAR(50) DEFAULT 'REMEDIAL_PRACTICE',
    priority VARCHAR(20) DEFAULT 'HIGH',
    action_plan JSONB NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Table: placement_readiness
CREATE TABLE IF NOT EXISTS placement_readiness (
    student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    score NUMERIC(5,2) DEFAULT 0.0,
    technical NUMERIC(5,2) DEFAULT 75.0,
    coding NUMERIC(5,2) DEFAULT 70.0,
    aptitude NUMERIC(5,2) DEFAULT 80.0,
    communication NUMERIC(5,2) DEFAULT 85.0,
    projects NUMERIC(5,2) DEFAULT 75.0,
    updated_at TIMESTAMP DEFAULT now()
);

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_8_SETUP', 'prediction_tables', 'PHASE_8', 'SYSTEM_ADMIN');
