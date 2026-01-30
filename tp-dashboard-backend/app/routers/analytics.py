from fastapi import APIRouter
from app.analytics.attendance import analyze_attendance
from app.analytics.assessment import analyze_assessment

router = APIRouter()

@router.get("/metrics")
def get_metrics():
    return {"message": "Use /attendance or /assessment endpoints"}

@router.get("/attendance")
def get_attendance_metrics():
    return analyze_attendance()

@router.get("/assessment")
def get_assessment_metrics():
    return analyze_assessment()

@router.get("/rag")
def get_rag_metrics():
    from app.analytics.rag import analyze_rag
    return analyze_rag()

@router.get("/observation")
def get_observation_metrics():
    from app.analytics.observation import analyze_observation
    return analyze_observation()

@router.get("/student/{student_id}")
def get_student_metrics(student_id: str):
    from app.analytics.student_profile import get_student_profile
    return get_student_profile(student_id)

@router.get("/student/{student_id}/detailed")
def get_student_detailed_metrics(student_id: str):
    from app.analytics.student_detailed import get_detailed_student_profile
    return get_detailed_student_profile(student_id)

@router.get("/batch/overview")
def get_batch_metrics():
    from app.analytics.batch_overview import get_batch_overview
    return get_batch_overview()

@router.get("/dashboard/admin")
def get_admin_dashboard_metrics():
    from app.analytics.admin_dashboard import get_admin_dashboard
    return get_admin_dashboard()

@router.get("/batch/comprehensive_stats")
def get_comprehensive_batch_stats():
    from app.analytics.comprehensive_stats import get_comprehensive_stats
    return get_comprehensive_stats()

@router.get("/students/all")
def get_all_student_stats():
    from app.analytics.all_students import get_all_students
    return get_all_students()
