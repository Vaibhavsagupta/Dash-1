-- =========================================================
-- Curriculum OS Phase 9 — Institutional Intelligence & Accreditation Command Center (IIACC)
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: institutional_kpis
CREATE TABLE IF NOT EXISTS institutional_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'ACADEMIC',
    formula TEXT,
    target_value NUMERIC(5,2) DEFAULT 80.0,
    current_value NUMERIC(5,2) DEFAULT 82.5,
    updated_at TIMESTAMP DEFAULT now()
);

-- 2. Table: scheduled_reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'WEEKLY',
    recipient_role VARCHAR(50) DEFAULT 'HOD',
    format VARCHAR(10) DEFAULT 'PDF',
    last_sent TIMESTAMP DEFAULT now(),
    active BOOLEAN DEFAULT TRUE
);

-- 3. Table: report_history
CREATE TABLE IF NOT EXISTS report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    file_path TEXT,
    generated_at TIMESTAMP DEFAULT now()
);

-- 4. Table: accreditation_evidence
CREATE TABLE IF NOT EXISTS accreditation_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accreditation_body VARCHAR(20) NOT NULL,
    criterion_code VARCHAR(50) NOT NULL,
    evidence_title TEXT NOT NULL,
    evidence_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'VERIFIED',
    created_at TIMESTAMP DEFAULT now()
);

-- 5. Table: benchmark_snapshots
CREATE TABLE IF NOT EXISTS benchmark_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_type VARCHAR(50) NOT NULL,
    entity_a VARCHAR(100) NOT NULL,
    entity_b VARCHAR(100) NOT NULL,
    metrics_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_9_SETUP', 'institutional_tables', 'PHASE_9', 'SYSTEM_ADMIN');
