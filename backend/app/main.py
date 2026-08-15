import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from sqlalchemy import text
from .routers import auth, analytics, updates, attendance, dashboard, assignments, automation, autograder, ingest, ai_report, admin_workflow, settings, tests, student_tests, marks_parameters, college_sandbox
from . import models

from contextlib import asynccontextmanager

def auto_init_database():
    print("[Auto-Init] Verifying database schema & default user accounts...")
    try:
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
                
                students = db.query(models.Student).all()
                for s in students:
                    db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["DSA"], score=float(s.dsa_score or 0)))
                    db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["ML"], score=float(s.ml_score or 0)))
                    db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["QA"], score=float(s.qa_score or 0)))
                    db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["Projects"], score=float(s.projects_score or 0)))
                    db.add(models.StudentParameterMark(student_id=s.student_id, parameter_id=params_created["Mock Interview"], score=float(s.mock_interview_score or 0)))
                db.commit()
            print("[Auto-Init] Database ready.")
        except Exception as e:
            print(f"Error during auto_init_database: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        print(f"Database connection error during auto-init: {e}")

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

@app.get("/health")
def health_check():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dashboard API"}

@app.head("/")
def health_check_head():
    return ""
