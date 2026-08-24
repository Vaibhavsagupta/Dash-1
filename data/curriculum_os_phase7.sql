-- =========================================================
-- Curriculum OS Phase 7 — Learning Intelligence Engine (LIE)
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: student_topic_mastery
CREATE TABLE IF NOT EXISTS student_topic_mastery (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES course_topics(id) ON DELETE CASCADE,
    mastery_score NUMERIC(5,2) DEFAULT 0.0,
    confidence NUMERIC(5,2) DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT now(),
    PRIMARY KEY (student_id, topic_id)
);

-- 2. Table: student_co_attainment
CREATE TABLE IF NOT EXISTS student_co_attainment (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    co_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
    attainment NUMERIC(5,2) DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT now(),
    PRIMARY KEY (student_id, co_id)
);

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_7_SETUP', 'analytics_tables', 'PHASE_7', 'SYSTEM_ADMIN');
