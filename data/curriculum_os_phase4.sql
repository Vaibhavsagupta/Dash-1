-- =========================================================
-- Curriculum OS Phase 4 — Attendance Intelligence Engine (AIE)
-- PostgreSQL Master Schema Script (DBeaver Compatible)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: lecture_sessions
CREATE TABLE IF NOT EXISTS lecture_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id INT REFERENCES batches(id),
    semester INT NOT NULL,
    topic_id UUID REFERENCES course_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    lecture_date DATE DEFAULT current_date,
    start_time TIME,
    end_time TIME,
    qr_token VARCHAR(100) UNIQUE,
    session_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT now()
);

-- 2. Table: attendance_records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID REFERENCES lecture_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PRESENT',
    check_in TIMESTAMP DEFAULT now(),
    check_out TIMESTAMP,
    attendance_mode VARCHAR(20) DEFAULT 'QR',
    confidence_score NUMERIC(5,2) DEFAULT 100.0,
    device_fingerprint VARCHAR(100),
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Table: attendance_summary
CREATE TABLE IF NOT EXISTS attendance_summary (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    total_classes INT DEFAULT 0,
    attended INT DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0.0,
    risk_score NUMERIC(5,2) DEFAULT 0.0,
    PRIMARY KEY(student_id, course_id)
);

-- 4. Table: attendance_alerts
CREATE TABLE IF NOT EXISTS attendance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- Audit Log Entry
INSERT INTO curriculum_audit (action, table_name, record_id, performed_by)
VALUES ('PHASE_4_SETUP', 'attendance_tables', 'PHASE_4', 'SYSTEM_ADMIN');
