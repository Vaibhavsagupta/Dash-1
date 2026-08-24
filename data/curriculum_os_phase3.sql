-- =========================================================
-- Curriculum OS Phase 3 — Student & Faculty Management System
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_no VARCHAR(50) UNIQUE NOT NULL,
    scholar_no VARCHAR(50) UNIQUE,
    full_name TEXT NOT NULL,
    gender VARCHAR(20),
    dob DATE,
    email TEXT,
    mobile VARCHAR(20),
    parent_name TEXT,
    parent_mobile VARCHAR(20),
    address TEXT,
    blood_group VARCHAR(10),
    batch_id INT REFERENCES batches(id),
    program_id INT REFERENCES programs(id),
    current_semester INT DEFAULT 1,
    admission_year INT DEFAULT 2023,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT now()
);

-- 2. Table: faculty
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(30) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile VARCHAR(20),
    designation TEXT DEFAULT 'Assistant Professor',
    department TEXT DEFAULT 'CSE',
    joining_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 3. Table: faculty_course_mapping
CREATE TABLE IF NOT EXISTS faculty_course_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id INT REFERENCES batches(id),
    semester INT NOT NULL,
    academic_session_id INT REFERENCES academic_sessions(id)
);

-- 4. Table: student_academic_mapping
CREATE TABLE IF NOT EXISTS student_academic_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    academic_session_id INT REFERENCES academic_sessions(id),
    batch_id INT REFERENCES batches(id),
    program_id INT REFERENCES programs(id),
    semester INT NOT NULL,
    promoted BOOLEAN DEFAULT TRUE
);

-- 5. Table: user_accounts
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    linked_student UUID REFERENCES students(id) ON DELETE SET NULL,
    linked_faculty UUID REFERENCES faculty(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed Faculty Sample
INSERT INTO faculty (employee_code, full_name, email, designation, department)
VALUES ('T01', 'Prof. Teacher', 'teacher@sage.com', 'Associate Professor', 'CSE')
ON CONFLICT (employee_code) DO NOTHING;

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_3_SETUP', 'people_tables', 'PHASE_3', 'SYSTEM_ADMIN');
