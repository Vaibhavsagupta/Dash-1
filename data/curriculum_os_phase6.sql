-- =========================================================
-- Curriculum OS Phase 6 — Exam Operating System (Exam OS)
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: tests
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    total_marks INT DEFAULT 100,
    duration_minutes INT DEFAULT 180,
    test_type VARCHAR(30) DEFAULT 'ENDSEM',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT now()
);

-- 2. Table: test_assignments
CREATE TABLE IF NOT EXISTS test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT now(),
    attempt_limit INT DEFAULT 1
);

-- 3. Table: test_attempts
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT now(),
    submitted_at TIMESTAMP,
    score NUMERIC(5,2) DEFAULT 0.0,
    percentage NUMERIC(5,2) DEFAULT 0.0,
    tab_switch_count INT DEFAULT 0,
    fullscreen_violations INT DEFAULT 0,
    suspicious_score NUMERIC(5,2) DEFAULT 0.0
);

-- 4. Table: student_answers
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT,
    code_language VARCHAR(20),
    obtained_marks NUMERIC(5,2) DEFAULT 0.0,
    is_correct BOOLEAN DEFAULT FALSE,
    ai_feedback TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_6_SETUP', 'exam_tables', 'PHASE_6', 'SYSTEM_ADMIN');
