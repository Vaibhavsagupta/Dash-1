-- =========================================================
-- Curriculum OS Phase 5 — AI Question Intelligence Engine (QIE)
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES course_topics(id) ON DELETE SET NULL,
    co_id UUID REFERENCES course_outcomes(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES course_units(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) DEFAULT 'SHORT',
    difficulty VARCHAR(20) DEFAULT 'Medium',
    bloom_level VARCHAR(30) DEFAULT 'Understand',
    marks INT DEFAULT 5,
    language VARCHAR(20) DEFAULT 'English',
    source_type VARCHAR(20) DEFAULT 'OFFICIAL',
    ai_generated BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'PENDING_REVIEW',
    version INT DEFAULT 1,
    embedding_str TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- 2. Table: question_versions
CREATE TABLE IF NOT EXISTS question_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    version INT NOT NULL,
    question_text TEXT NOT NULL,
    modified_by VARCHAR(36),
    change_summary TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Table: question_options
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_key VARCHAR(10) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- 4. Table: question_solutions
CREATE TABLE IF NOT EXISTS question_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    solution_text TEXT NOT NULL,
    stepwise_explanation TEXT,
    references_text TEXT
);

-- 5. Table: question_papers
CREATE TABLE IF NOT EXISTS question_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id INT REFERENCES batches(id),
    semester INT NOT NULL,
    total_marks INT DEFAULT 100,
    duration_minutes INT DEFAULT 180,
    template_type VARCHAR(30) DEFAULT 'EndSem',
    paper_structure JSONB NOT NULL,
    created_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_5_SETUP', 'question_tables', 'PHASE_5', 'SYSTEM_ADMIN');
