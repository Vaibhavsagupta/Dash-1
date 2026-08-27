import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from sqlalchemy import text
from .routers import auth, analytics, updates, attendance, dashboard, assignments, automation, autograder, ingest, ai_report, admin_workflow, settings, tests, student_tests, marks_parameters, college_sandbox
from .curriculum import routes as curriculum_routes
from .curriculum.seed import seed_curriculum
from .syllabus import routes as syllabus_routes
from .people import routes as people_routes
from .attendance import routes as attendance_intelligence_routes
from .questions import routes as question_intelligence_routes
from .exam import routes as exam_routes
from .analytics import routes as analytics_routes
from .predictions import routes as predictions_routes
from .institution import routes as institution_routes
from . import models

from contextlib import asynccontextmanager

def auto_init_database():
    print("[Auto-Init] Verifying database schema & default user accounts...")
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            for stmt in [
                "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
                "ALTER TABLE courses ADD COLUMN IF NOT EXISTS id VARCHAR(36);",
                "UPDATE courses SET id = gen_random_uuid()::text WHERE id IS NULL;",
                "ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_pkey CASCADE;",
                "ALTER TABLE courses ADD CONSTRAINT courses_id_pk PRIMARY KEY (id);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS id VARCHAR(36);",
                "UPDATE students SET id = gen_random_uuid()::text WHERE id IS NULL;",
                "ALTER TABLE students DROP CONSTRAINT IF EXISTS students_pkey CASCADE;",
                "ALTER TABLE students ADD CONSTRAINT students_id_pk PRIMARY KEY (id);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name TEXT;",
                "ALTER TABLE students ALTER COLUMN name DROP NOT NULL;",
                "UPDATE students SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;",
                "UPDATE students SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS dob DATE;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_mobile VARCHAR(20);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_id INT;",
                "UPDATE students SET batch_id = NULL WHERE batch_id::text !~ '^[0-9]+$';",
                "ALTER TABLE students ALTER COLUMN batch_id TYPE INT USING (CASE WHEN batch_id::text ~ '^[0-9]+$' THEN batch_id::text::INT ELSE NULL END);",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS program_id INT;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS current_semester INT DEFAULT 1;",
                "ALTER TABLE students ALTER COLUMN semester DROP NOT NULL;",
                "UPDATE students SET current_semester = semester WHERE current_semester IS NULL AND semester IS NOT NULL;",
                "UPDATE students SET semester = current_semester WHERE semester IS NULL AND current_semester IS NOT NULL;",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';",
                "ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();",
                "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_code VARCHAR(30);",
                "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS full_name TEXT;",
                "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);",
                "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS designation TEXT;",
                "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department TEXT;",
                "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS joining_date DATE;",
                "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';",
                "ALTER TABLE questions DROP COLUMN IF EXISTS options CASCADE;",
                "ALTER TABLE questions ALTER COLUMN test_id DROP NOT NULL;",
                "ALTER TABLE questions ALTER COLUMN correct_answer DROP NOT NULL;",
                "ALTER TABLE questions ALTER COLUMN subject DROP NOT NULL;",
                "ALTER TABLE questions ALTER COLUMN topic DROP NOT NULL;",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS course_id VARCHAR(36);",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_id VARCHAR(36);",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS co_id VARCHAR(36);",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS unit_id VARCHAR(36);",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(30) DEFAULT 'Understand';",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks INT DEFAULT 5;",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'English';",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'OFFICIAL';",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT TRUE;",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING_REVIEW';",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS embedding_str TEXT;",
                "ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();",
                "ALTER TABLE tests ALTER COLUMN teacher_id DROP NOT NULL;",
                "ALTER TABLE tests ALTER COLUMN name DROP NOT NULL;",
                "ALTER TABLE tests ALTER COLUMN subject DROP NOT NULL;",
                "ALTER TABLE tests ALTER COLUMN topic DROP NOT NULL;",
                "ALTER TABLE tests ALTER COLUMN duration DROP NOT NULL;",
                "ALTER TABLE tests ALTER COLUMN passing_marks DROP NOT NULL;",
                "ALTER TABLE tests ALTER COLUMN difficulty DROP NOT NULL;",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS title TEXT;",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS course_id VARCHAR(36);",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(36);",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 100;",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 180;",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS test_type VARCHAR(30) DEFAULT 'ENDSEM';",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;",
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';",
                "ALTER TABLE test_attempts ALTER COLUMN test_assignment_id DROP NOT NULL;",
                "ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS test_id VARCHAR(36);",
                "ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT now();",
                "ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;",
                "ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS tab_switch_count INT DEFAULT 0;",
                "ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS fullscreen_violations INT DEFAULT 0;",
                "ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS suspicious_score NUMERIC(5,2) DEFAULT 0.0;",
                "ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS question_id VARCHAR(36);",
                "ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS answer TEXT;",
                "ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS code_language VARCHAR(20);",
                "ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS obtained_marks NUMERIC(5,2) DEFAULT 0.0;",
                "ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS ai_feedback TEXT;",
                "ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();"
            ]:
                try:
                    with engine.begin() as conn:
                        conn.execute(text(stmt))
                except Exception as s_err:
                    pass

            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                from .auth import get_password_hash

                # Ensure default Admin account
                if not db.query(models.User).filter(models.User.email == "admin@sage.com").first():
                    print("[Auto-Init] Creating default Admin (admin@sage.com)...")
                    db.add(models.User(email="admin@sage.com", password_hash=get_password_hash("password"), role=models.UserRole.admin, approved=True, is_verified=True))
                    if not db.query(models.Admin).filter(models.Admin.email == "admin@sage.com").first():
                        db.add(models.Admin(email="admin@sage.com", password=get_password_hash("password"), is_super_admin=True, approved=True))

                # Ensure default Teacher account
                if not db.query(models.User).filter(models.User.email == "teacher@sage.com").first():
                    print("[Auto-Init] Creating default Teacher (teacher@sage.com)...")
                    if not db.query(models.Teacher).filter(models.Teacher.teacher_id == "T01").first():
                        db.add(models.Teacher(teacher_id="T01", name="Prof. Teacher", email="teacher@sage.com", department="CSE", subject="CS", avg_improvement=15.0, feedback_score=4.5, content_quality_score=4.2, placement_conversion=20.0))
                    db.add(models.User(email="teacher@sage.com", password_hash=get_password_hash("password"), role=models.UserRole.teacher, linked_id="T01", approved=True, is_verified=True))

                # Seed Real Students from real_students_full.json if database has fewer than 100 students
                student_count = db.query(models.Student).count()
                if student_count < 100:
                    json_data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "real_students_full.json")
                    if os.path.exists(json_data_path):
                        print("[Auto-Init] Seeding real student dataset (153 students)...")
                        import json
                        with open(json_data_path, "r", encoding="utf-8") as f:
                            real_students = json.load(f)
                        
                        for s_data in real_students:
                            existing = db.query(models.Student).filter(models.Student.enrollment_no == s_data["student_id"]).first()
                            if not existing:
                                scholar_no_val = s_data.get("scholar_no")
                                if not scholar_no_val or str(scholar_no_val).lower() == "nan":
                                    scholar_no_val = None

                                st = models.Student(
                                    enrollment_no=s_data["student_id"],
                                    scholar_no=scholar_no_val,
                                    name=s_data["name"],
                                    email=s_data["email"],
                                    program=s_data.get("program", "B.Tech"),
                                    branch=s_data.get("branch", "CSE"),
                                    semester=6,
                                    section="A",
                                    cgpa=s_data.get("cgpa", 8.0),
                                    active_backlogs=s_data.get("active_backlogs", 0),
                                    admission_year=2020 if "2020" in s_data["batch_id"] else (2021 if "2021" in s_data["batch_id"] else 2022),
                                    identity_proof=s_data.get("identity_proof"),
                                    attendance=s_data.get("attendance", 85),
                                    dsa_score=s_data.get("dsa_score", 80),
                                    ml_score=s_data.get("ml_score", 78),
                                    qa_score=s_data.get("qa_score", 82),
                                    projects_score=s_data.get("projects_score", 85),
                                    mock_interview_score=s_data.get("mock_interview_score", 80),
                                    rag_status=s_data.get("rag_status", "Green"),
                                    batch_id=s_data.get("batch_id"),
                                    pre_score=s_data.get("pre_score", 70.0),
                                    post_score=s_data.get("post_score", 88.0),
                                    pre_communication=s_data.get("pre_communication", 3.5),
                                    post_communication=s_data.get("post_communication", 4.5),
                                    pre_engagement=s_data.get("pre_engagement", 3.5),
                                    post_engagement=s_data.get("post_engagement", 4.5),
                                    pre_subject_knowledge=s_data.get("pre_subject_knowledge", 3.5),
                                    post_subject_knowledge=s_data.get("post_subject_knowledge", 4.5),
                                    pre_confidence=s_data.get("pre_confidence", 3.5),
                                    post_confidence=s_data.get("post_confidence", 4.5),
                                    pre_fluency=s_data.get("pre_fluency", 3.5),
                                    post_fluency=s_data.get("post_fluency", 4.5),
                                    pre_remarks=s_data.get("pre_remarks"),
                                    pre_status=s_data.get("pre_status"),
                                    post_remarks=s_data.get("post_remarks"),
                                    post_status=s_data.get("post_status"),
                                    external_certifications=s_data.get("external_certifications", 2)
                                )
                                db.add(st)
                                db.flush()
                                
                                # Add User account for student
                                if not db.query(models.User).filter(models.User.email == s_data["email"]).first():
                                    db.add(models.User(
                                        email=s_data["email"],
                                        password_hash=get_password_hash("password123"),
                                        role=models.UserRole.student,
                                        linked_id=st.enrollment_no,
                                        approved=True,
                                        is_verified=True
                                    ))
                        db.commit()

                # Ensure default Student account
                if not db.query(models.User).filter(models.User.email == "vaibhav@sage.com").first():
                    print("[Auto-Init] Creating default Student (vaibhav@sage.com)...")
                    student = db.query(models.Student).first()
                    if not student:
                        student = models.Student(
                            enrollment_no="23BTA3ARI10038",
                            scholar_no="231945",
                            name="Vaibhav Gupta",
                            email="vaibhav@sage.com",
                            program="B.Tech",
                            branch="AI",
                            admission_year=2023,
                            semester=6,
                            section="A",
                            attendance=85,
                            dsa_score=80,
                            ml_score=78,
                            qa_score=82,
                            projects_score=85,
                            mock_interview_score=80,
                            rag_status="Green"
                        )
                        db.add(student)
                        db.flush()
                    db.add(models.User(email="vaibhav@sage.com", password_hash=get_password_hash("password"), role=models.UserRole.student, linked_id=student.enrollment_no, approved=True, is_verified=True))

                db.commit()

                # Seed Marks Parameters if missing
                count = db.query(models.MarksParameter).count()
                if count == 0:
                    print("[Auto-Init] Seeding default Marks Parameters...")
                    defaults = [
                        {"name": "DSA", "subject": "Data Structures", "desc": "Data Structures and Algorithms score"},
                        {"name": "ML", "subject": "Machine Learning", "desc": "Machine Learning fundamentals score"},
                        {"name": "QA", "subject": "Quantitative Aptitude", "desc": "Quantitative Aptitude score"},
                        {"name": "Projects", "subject": "Projects", "desc": "Project completion score"},
                        {"name": "Mock Interview", "subject": "Mock Interview", "desc": "Mock interview performance score"}
                    ]
                    params_created = {}
                    for d in defaults:
                        p = models.MarksParameter(
                            parameter_name=d["name"],
                            description=d["desc"],
                            max_marks=100.0,
                            weightage=20.0,
                            subject=d["subject"],
                            semester="Semester 1",
                            status="Active"
                        )
                        db.add(p)
                        db.commit()
                        db.refresh(p)
                        params_created[d["name"]] = p.id

                # Seed Tests & TestAssignments if missing
                if db.query(models.Test).count() == 0:
                    print("[Auto-Init] Seeding default tests & test assignments...")
                    import datetime
                    teacher = db.query(models.Teacher).first()
                    t_id = teacher.faculty_id if teacher else "T01"
                    
                    t1 = models.Test(id="TEST001", teacher_id=t_id, name="Python & DSA Fundamentals Test", subject="Data Structures", topic="Python Basics & Arrays", description="Assessment on Python fundamentals, list operations, and memory complexity.", duration=45, passing_marks=40, difficulty="Medium", approved=True)
                    t2 = models.Test(id="TEST002", teacher_id=t_id, name="DBMS & SQL Comprehensive Assessment", subject="DBMS", topic="Normalization & SQL Queries", description="Mid-term evaluation covering 1NF-3NF, JOINs and indexing.", duration=60, passing_marks=50, difficulty="Hard", approved=True)
                    t3 = models.Test(id="TEST003", teacher_id=t_id, name="Machine Learning & Predictive Models", subject="Machine Learning", topic="Classification & Regression", description="Quiz on supervised learning algorithms, decision trees, and confusion matrix.", duration=30, passing_marks=35, difficulty="Medium", approved=True)
                    db.add_all([t1, t2, t3])
                    db.commit()

                    students_list = db.query(models.Student).all()
                    today_dt = datetime.date.today()
                    start_dt = today_dt - datetime.timedelta(days=2)
                    end_dt = today_dt + datetime.timedelta(days=14)
                    
                    asgs = []
                    for st_item in students_list:
                        for t_item in [t1, t2, t3]:
                            asgs.append(models.TestAssignment(
                                id=f"ASG_{st_item.enrollment_no}_{t_item.id}",
                                test_id=t_item.id,
                                student_id=st_item.enrollment_no,
                                assigned_by=t_id,
                                start_date=start_dt,
                                end_date=end_dt,
                                status="Pending"
                            ))
                    db.add_all(asgs)
                    db.commit()
                    
                    students = db.query(models.Student).all()
                    for s in students:
                        db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["DSA"], score=float(s.dsa_score or 0)))
                        db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["ML"], score=float(s.ml_score or 0)))
                        db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["QA"], score=float(s.qa_score or 0)))
                        db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["Projects"], score=float(s.projects_score or 0)))
                        db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["Mock Interview"], score=float(s.mock_interview_score or 0)))
                    db.commit()

                # Seed Curriculum OS
                try:
                    seed_curriculum(db)
                except Exception as c_err:
                    print(f"[Auto-Init] Curriculum seed warning: {c_err}")

                print("[Auto-Init] Database ready.")
                return
            except Exception as e:
                print(f"Error during auto_init_database: {e}")
                db.rollback()
            finally:
                db.close()
        except Exception as e:
            print(f"[Auto-Init] Database connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                import time
                time.sleep(3)

@asynccontextmanager
async def lifespan(app: FastAPI):
    auto_init_database()
    yield

app = FastAPI(title="Dashboard Auth System", lifespan=lifespan)

# CORS Setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://dash-1-orcin.vercel.app",
    "https://dash-1-git-main-vaibhavsaguptas-projects.vercel.app",
    "https://dash-1.vercel.app",
]

# Add production URL if provided
production_url = os.getenv("FRONTEND_URL")
if production_url:
    for url in production_url.split(','):
        clean_url = url.strip().rstrip('/')
        if clean_url:
            origins.append(clean_url)
            if clean_url.startswith("http://"):
                origins.append(clean_url.replace("http://", "https://"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

@app.api_route("/ping", methods=["GET", "HEAD"])
def ping():
    return {"status": "pong"}



app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(updates.router)
app.include_router(attendance.router)
app.include_router(dashboard.router)
app.include_router(assignments.router)
app.include_router(automation.router)
app.include_router(autograder.router)
app.include_router(ingest.router)
app.include_router(ai_report.router)
app.include_router(admin_workflow.router)
app.include_router(settings.router)
app.include_router(tests.router)
app.include_router(student_tests.router)
app.include_router(marks_parameters.router)
app.include_router(college_sandbox.router)
app.include_router(curriculum_routes.router)
app.include_router(syllabus_routes.router)
app.include_router(people_routes.router)
app.include_router(attendance_intelligence_routes.router)
app.include_router(question_intelligence_routes.router)
app.include_router(exam_routes.router)
app.include_router(analytics_routes.router)
app.include_router(predictions_routes.router)
app.include_router(institution_routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dashboard API"}

@app.head("/")
def health_check_head():
    return ""
