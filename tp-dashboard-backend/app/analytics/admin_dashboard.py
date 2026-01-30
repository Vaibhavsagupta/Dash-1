from app.analytics.assessment import analyze_assessment
from app.analytics.attendance import analyze_attendance

def get_admin_dashboard():
    # 1. Assessment Data mainly
    ass = analyze_assessment()
    att = analyze_attendance()
    
    # Total Students
    # Try to find max count from any dataset
    count_ass = len(ass.get("all_students", []))
    count_att = len(att.get("student_details", []))
    total_students = max(count_ass, count_att)
    
    # Top Students
    # Map 'calculated_avg' or 'percentage' to 'prs'
    formatted_top = []
    top_list = ass.get("top_performers", [])
    if top_list:
        for i, s in enumerate(top_list):
            # s has {name: ..., score_col: ...}
            # Find the numeric score
            vals = [v for k,v in s.items() if isinstance(v, (int, float))]
            score = vals[0] if vals else 0
            # Find name
            names = [v for k,v in s.items() if isinstance(v, str) and k != "_id"]
            name = names[0] if names else "Unknown"
            
            formatted_top.append({
                "id": f"{name}_{i}", 
                "name": name, 
                "prs": round(score, 1)
            })
    
    # If no top students (e.g. empty DB), mock some so UI doesn't look broken during demo
    if not formatted_top:
        formatted_top = []

    # Teacher Performance (Mapped from Subject Averages)
    teachers = []
    if "subject_averages" in ass and ass["subject_averages"]:
        for subject, avg_score in ass["subject_averages"].items():
            teachers.append({
                "id": subject,
                "name": f"{subject} Faculty",
                "subject": subject,
                "tei": round(avg_score, 1)
            })
    
    if not teachers:
        # Mock if empty to show UI structure
        teachers = []

    res = {
        "total_students": total_students,
        "avg_prs": ass.get("class_average", 0),
        "top_students": formatted_top,
        "teacher_performance": teachers
    }
    
    if total_students == 0:
        res["status"] = "no_data"
        res["message"] = "No datasets uploaded yet. Please upload files to see analytics."
        
    return res
