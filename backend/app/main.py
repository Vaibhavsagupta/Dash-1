import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from sqlalchemy import text
from .routers import auth, analytics, updates, attendance, dashboard, assignments, automation, autograder, ingest, ai_report, admin_workflow

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    print("Connected to database successfully")
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
    allow_credentials=True,
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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dashboard API"}

@app.head("/")
def health_check_head():
    return ""
