-- =========================================================
-- Curriculum OS Phase 1 — PostgreSQL Master Schema & Seeder
-- DBeaver Compatible Script
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: programs
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Table: semester_templates
CREATE TABLE IF NOT EXISTS semester_templates (
    semester INT PRIMARY KEY,
    total_marks INT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Table: course_slots
CREATE TABLE IF NOT EXISTS course_slots (
    id SERIAL PRIMARY KEY,
    semester INT REFERENCES semester_templates(semester),
    slot_code VARCHAR(30),
    slot_name TEXT NOT NULL,
    slot_type VARCHAR(50),
    max_marks INT,
    is_specialization BOOLEAN DEFAULT FALSE,
    is_generic_elective BOOLEAN DEFAULT FALSE,
    display_order INT
);

-- 4. Table: courses
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id INT REFERENCES programs(id),
    semester INT REFERENCES semester_templates(semester),
    slot_id INT REFERENCES course_slots(id),
    course_code VARCHAR(30),
    course_name TEXT NOT NULL,
    theory_marks INT DEFAULT 0,
    practical_marks INT DEFAULT 0,
    internal_marks INT DEFAULT 0,
    external_marks INT DEFAULT 0,
    UNIQUE(program_id, semester, course_code)
);

-- 5. Table: batches
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    batch_year INT UNIQUE
);

-- 6. Table: academic_sessions
CREATE TABLE IF NOT EXISTS academic_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(20),
    is_current BOOLEAN
);

-- 7. Table: curriculum_versions
CREATE TABLE IF NOT EXISTS curriculum_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id INT REFERENCES programs(id),
    semester INT,
    academic_year VARCHAR(20),
    version_no INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT now()
);

-- 8. Table: curriculum_audit
CREATE TABLE IF NOT EXISTS curriculum_audit (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id TEXT,
    performed_by TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- SEED DATA
INSERT INTO programs (code, name, is_active) VALUES 
('AI', 'Artificial Intelligence', TRUE),
('CSF', 'Cyber Security & Forensics', TRUE),
('FSD', 'Full Stack Development', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO semester_templates (semester, total_marks) VALUES 
(1, 900), (2, 950), (3, 1050), (4, 1000), 
(5, 1000), (6, 900), (7, 600), (8, 600)
ON CONFLICT (semester) DO UPDATE SET total_marks = EXCLUDED.total_marks;

INSERT INTO batches (batch_year) VALUES (2020), (2021), (2022), (2023)
ON CONFLICT (batch_year) DO NOTHING;

INSERT INTO academic_sessions (session_name, is_current) VALUES ('2025-26', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('INITIAL_DBEAVER_SETUP', 'all_tables', 'PHASE_1', 'DBEAVER_ADMIN');
