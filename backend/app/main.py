import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from sqlalchemy import text
from .routers import auth, analytics, updates, attendance, dashboard, assignments, automation, autograder, ingest, ai_report, admin_workflow, settings, tests, student_tests, marks_parameters, college_sandbox
from . import models

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    print("Connected to database successfully")
    
    # Auto-seed marks parameters
    def populate_default_marks_parameters():
        db = SessionLocal()
        try:
            count = db.query(models.MarksParameter).count()
            if count == 0:
                print("Seeding default Marks Parameters and backfilling student scores...")
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
                print("Successfully backfilled all student scores into student_parameter_marks.")
        except Exception as e:
            print(f"Error seeding marks parameters: {e}")
            db.rollback()
        finally:
            db.close()

    populate_default_marks_parameters()

except Exception as e:
    print(f"Database connection failed or tables already exist: {e}")

app = FastAPI(title="Dashboard Auth System")

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
