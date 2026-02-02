import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, analytics, updates, attendance, dashboard, assignments, automation, autograder, ingest, ai_report

# Create tables
try:
    Base.metadata.create_all(bind=engine)
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
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://dash-1-orcin.vercel.app",
    "https://dash-1-git-main-vaibhavsaguptas-projects.vercel.app",
    "https://dash-1.vercel.app",
]

# Add production URL if provided
production_url = os.getenv("FRONTEND_URL")
if production_url:
    # Handle multiple comma-separated URLs if needed
    for url in production_url.split(','):
        clean_url = url.strip().rstrip('/')
        if clean_url:
            origins.append(clean_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}


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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dashboard API"}
