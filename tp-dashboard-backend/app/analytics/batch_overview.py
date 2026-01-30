from app.analytics.attendance import analyze_attendance
from app.analytics.assessment import analyze_assessment
from app.analytics.observation import analyze_observation
from app.analytics.rag import analyze_rag

def get_batch_overview():
    """
    Aggregates high-level metrics for the entire batch.
    """
    overview = {}
    
    # RAG
    rag = analyze_rag()
    overview["rag_distribution"] = rag.get("rag_distribution", {})
    
    # Attendance
    att = analyze_attendance()
    overview["avg_attendance"] = att.get("average_attendance", 0)
    overview["low_attendance_count"] = att.get("low_attendance_count", 0)
    
    # Assessment
    ass = analyze_assessment()
    overview["avg_assessment_score"] = ass.get("class_average", 0)
    overview["top_performers_count"] = len(ass.get("top_performers", []))
    
    # Observation
    obs = analyze_observation()
    overview["avg_observation_growth"] = obs.get("average_growth", 0)
    overview["students_improved"] = obs.get("students_improved", 0)
    
    # Overall Status
    # Determine batch health
    if overview["avg_attendance"] > 80 and overview["avg_assessment_score"] > 70:
        overview["batch_health"] = "Excellent"
    elif overview["avg_attendance"] > 60:
        overview["batch_health"] = "Average"
    else:
        overview["batch_health"] = "Needs Attention"
        
    return overview
