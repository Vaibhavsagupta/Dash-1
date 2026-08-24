-- =========================================================
-- Curriculum OS Phase 2 — Syllabus Intelligence Engine
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: syllabus_files
CREATE TABLE IF NOT EXISTS syllabus_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    source_type VARCHAR(20) DEFAULT 'OFFICIAL', -- OFFICIAL or ADDITIONAL
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    uploaded_by UUID,
    upload_status VARCHAR(20) DEFAULT 'PROCESSED',
    parser_confidence NUMERIC(5,2) DEFAULT 95.00,
    created_at TIMESTAMP DEFAULT now()
);

-- 2. Table: course_units
CREATE TABLE IF NOT EXISTS course_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syllabus_file_id UUID REFERENCES syllabus_files(id) ON DELETE CASCADE,
    unit_number INT NOT NULL,
    unit_title TEXT NOT NULL,
    teaching_hours INT DEFAULT 8,
    display_order INT DEFAULT 1
);

-- 3. Table: course_topics
CREATE TABLE IF NOT EXISTS course_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES course_units(id) ON DELETE CASCADE,
    topic_order INT DEFAULT 1,
    topic_name TEXT NOT NULL,
    keywords TEXT[],
    embedding TEXT
);

-- 4. Table: course_outcomes
CREATE TABLE IF NOT EXISTS course_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syllabus_file_id UUID REFERENCES syllabus_files(id) ON DELETE CASCADE,
    co_code VARCHAR(10) NOT NULL,
    description TEXT NOT NULL
);

-- 5. Table: topic_co_mapping
CREATE TABLE IF NOT EXISTS topic_co_mapping (
    topic_id UUID REFERENCES course_topics(id) ON DELETE CASCADE,
    outcome_id UUID REFERENCES course_outcomes(id) ON DELETE CASCADE,
    PRIMARY KEY(topic_id, outcome_id)
);

-- 6. Table: recommended_books
CREATE TABLE IF NOT EXISTS recommended_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syllabus_file_id UUID REFERENCES syllabus_files(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT
);

-- Audit Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_2_SETUP', 'syllabus_tables', 'PHASE_2', 'SYSTEM_ADMIN');
