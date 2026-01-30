from app.analytics.assessment import analyze_assessment
from app.analytics.attendance import analyze_attendance
from app.analytics.observation import analyze_observation
import pandas as pd
import numpy as np

def get_detailed_student_profile(student_id: str):
    # 1. Fetch all data
    ass_data = analyze_assessment()
    att_data = analyze_attendance()
    obs_data = analyze_observation()
    
    # 2. Find Student across datasets (substring or exact match)
    s_id_lower = student_id.lower()
    
    # helper to find student in a record list
    def find_student(records, id_key='name'):
        for r in records:
            val = str(r.get(id_key, "")).lower()
            if s_id_lower == val or s_id_lower in val:
                return r
        return None

    ass_s = find_student(ass_data.get("all_students", []))
    att_s = find_student(att_data.get("student_details", []))
    obs_s = find_student(obs_data.get("student_growth_data", []), 'name')
    
    # 3. Resolve RAG Status (Derive if not present)
    from app.analytics.rag import analyze_rag
    rag_data = analyze_rag()
    # In a real system, we'd have a student-specific RAG mapping.
    # For now, we use a simple heuristic based on their assessment score.
    student_perc = ass_s.get("percentage", 0) if ass_s else 0
    rag_status = "Green" if student_perc >= 75 else "Amber" if student_perc >= 60 else "Red"

    # 4. Map Subject Scores (Normalization)
    # Technical -> DSA, Logical -> ML, Verbal/Math -> QA
    dsa = 0; ml = 0; qa = 0; mock = 0; projects = 0
    if ass_s:
        for k, v in ass_s.items():
            k_low = str(k).lower()
            if not isinstance(v, (int, float)): continue
            if "technical" in k_low: dsa = v
            elif "logical" in k_low: ml = v
            elif "verbal" in k_low or "math" in k_low: qa = max(qa, v)
            elif "mock" in k_low: mock = v
            elif "project" in k_low: projects = v

    # 5. Class Stats
    # Map subject averages from assessment
    subj_avgs = ass_data.get("subject_averages", {})
    class_stats = {
        "dsa_score": {"avg": subj_avgs.get("Technical", 0), "max": 100, "min": 0},
        "ml_score": {"avg": subj_avgs.get("Logical Leasoning", 0), "max": 100, "min": 0},
        "qa_score": {"avg": max(subj_avgs.get("Verbal", 0), subj_avgs.get("Maths/Numerical", 0)), "max": 100, "min": 0},
        "projects_score": {"avg": 0, "max": 100, "min": 0},
        "mock_interview_score": {"avg": 0, "max": 100, "min": 0},
        "pre_score": {"avg": obs_data.get("competency_breakdown", {}).get("level_comparison", {}).get("pre", 0), "max": 10, "min": 0},
        "post_score": {"avg": obs_data.get("competency_breakdown", {}).get("level_comparison", {}).get("post", 0), "max": 10, "min": 0},
    }

    # 6. Strengths and Weaknesses
    subjects = [
        {"subject": "DSA", "score": dsa, "avg": class_stats["dsa_score"]["avg"]},
        {"subject": "ML", "score": ml, "avg": class_stats["ml_score"]["avg"]},
        {"subject": "QA", "score": qa, "avg": class_stats["qa_score"]["avg"]},
        {"subject": "Mock Interview", "score": mock, "avg": class_stats["mock_interview_score"]["avg"]},
    ]
    
    strengths = []
    weaknesses = []
    for s in subjects:
        diff = round(s["score"] - s["avg"], 1)
        if diff >= 5:
            strengths.append({"subject": s["subject"], "score": s["score"], "avg": s["avg"], "diff": diff})
        elif diff <= -5:
            weaknesses.append({"subject": s["subject"], "score": s["score"], "avg": s["avg"], "diff": abs(diff)})

    # Final Response
    return {
        "student": {
            "student_id": student_id,
            "name": ass_s.get("name", att_s.get("name", "Unknown")) if (ass_s or att_s) else "Unknown",
            "pre_score": obs_s.get("pre", 0) if obs_s else 0,
            "post_score": obs_s.get("post", 0) if obs_s else 0,
            "dsa_score": dsa,
            "ml_score": ml,
            "qa_score": qa,
            "projects_score": projects,
            "mock_interview_score": mock,
            "attendance": att_s.get("attendance_percentage", 0) if att_s else 0,
            "rag_status": rag_status
        },
        "attendance_history": [], # In a real DB, we would query the actual logs
        "class_stats": class_stats,
        "percentiles": {
            "dsa_score": 0, "ml_score": 0, "qa_score": 0 # Logic for calculating this can be added
        },
        "strengths": strengths,
        "weaknesses": weaknesses
    }
