-- =========================================================
-- Curriculum OS Phase 1 — PostgreSQL Master Schema & Seeder
-- DBeaver Compatible Script
-- Execution Order:
--   1. programs
--   2. semester_templates
--   3. course_slots
--   4. courses
--   5. batches
--   6. academic_sessions
--   7. curriculum_versions
--   8. curriculum_audit
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

-- =========================================================
-- SEED DATA
-- =========================================================

-- Seed Programs
INSERT INTO programs (code, name, is_active) VALUES 
('AI', 'Artificial Intelligence', TRUE),
('CSF', 'Cyber Security & Forensics', TRUE),
('FSD', 'Full Stack Development', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed Semester Templates (1 to 8)
INSERT INTO semester_templates (semester, total_marks) VALUES 
(1, 900),
(2, 950),
(3, 1050),
(4, 1000),
(5, 1000),
(6, 900),
(7, 600),
(8, 600)
ON CONFLICT (semester) DO UPDATE SET total_marks = EXCLUDED.total_marks;

-- Seed Batches
INSERT INTO batches (batch_year) VALUES (2020), (2021), (2022), (2023)
ON CONFLICT (batch_year) DO NOTHING;

-- Seed Academic Sessions
INSERT INTO academic_sessions (session_name, is_current) VALUES ('2025-26', TRUE)
ON CONFLICT DO NOTHING;

-- Seed Course Slots (Semester 1)
INSERT INTO course_slots (semester, slot_code, slot_name, slot_type, max_marks, is_specialization, is_generic_elective, display_order) VALUES
(1, 'UC20B101', 'Environmental Studies and Disaster Management', 'Theory', 100, FALSE, FALSE, 1),
(1, 'UC20B102', 'Communication Skills', 'Theory', 100, FALSE, FALSE, 2),
(1, 'MA20B103', 'Engineering Mathematics-I', 'Theory', 100, FALSE, FALSE, 3),
(1, 'PY20B104', 'Engineering Physics', 'Theory+Practical', 150, FALSE, FALSE, 4),
(1, 'ME20B105', 'Engineering Drawing', 'Theory+Practical', 150, FALSE, FALSE, 5),
(1, 'CS20B106', 'Programming Practice-I', 'Practical', 50, FALSE, FALSE, 6),
(1, 'DSE-I', 'Specialization Subject-1', 'Specialization', 150, TRUE, FALSE, 7),
(1, 'PB20B101', 'Project Based Learning-I', 'Project', 100, FALSE, FALSE, 8)
ON CONFLICT DO NOTHING;

-- Seed Course Slots (Semester 7)
INSERT INTO course_slots (semester, slot_code, slot_name, slot_type, max_marks, is_specialization, is_generic_elective, display_order) VALUES
(7, 'DSE-XII', 'Specialization Subject-12', 'Specialization', 150, TRUE, FALSE, 1),
(7, 'DSE-XIII', 'Specialization Subject-13', 'Specialization', 150, TRUE, FALSE, 2),
(7, 'GE-III', 'Generic Elective-III', 'Theory', 100, FALSE, TRUE, 3),
(7, 'IN20B701', 'Industrial Internship', 'Practical', 200, FALSE, FALSE, 4)
ON CONFLICT DO NOTHING;

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('INITIAL_DBEAVER_SETUP', 'all_tables', 'PHASE_1', 'DBEAVER_ADMIN');
