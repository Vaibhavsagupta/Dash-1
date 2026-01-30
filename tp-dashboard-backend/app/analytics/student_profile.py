from app.analytics.attendance import analyze_attendance
from app.analytics.assessment import analyze_assessment
from app.analytics.observation import analyze_observation

def get_student_profile(student_id: str):
    """
    Aggregates data from all analytics modules for a specific student.
    Matches primarily on Name or ID substring.
    """
    student_id = str(student_id).lower().strip()
    profile = {"id": student_id, "name": "Unknown", "datasets_available": []}
    
    # 1. Attendance
    att_res = analyze_attendance()
    att_details = att_res.get("student_details", [])
    att_record = next((s for s in att_details if student_id in str(s.get("student", "")).lower()), None)
    
    if att_record:
        profile["name"] = att_record.get("student") # Update name from dataset
        profile["attendance"] = att_record
        profile["datasets_available"].append("attendance")
    else:
        profile["attendance"] = None

    # 2. Assessment
    ass_res = analyze_assessment()
    ass_details = ass_res.get("all_students", [])
    # More robust matching might be needed (e.g., Levenshtein), but substring is okay for now
    ass_record = next((s for s in ass_details if student_id in str(next(iter(s.values())) if s else "").lower()), None)
    # The dictionary keys are dynamic, so we check values or specific identified key if we knew it
    # We can try to guess the 'Name' key again or search all string values in the dict?
    # Simple approach: Check all values in the record
    if not ass_record and ass_details:
        for record in ass_details:
            if any(student_id in str(v).lower() for k,v in record.items() if isinstance(v, str)):
                ass_record = record
                break
                
    if ass_record:
        profile["name"] = profile["name"] if profile["name"] != "Unknown" else next(iter(ass_record.values()))
        profile["assessment"] = ass_record
        profile["datasets_available"].append("assessment")
    else:
        profile["assessment"] = None

    # 3. Observation
    obs_res = analyze_observation()
    obs_details = obs_res.get("student_growth", [])
    obs_record = None
    if obs_details:
        for record in obs_details:
             if any(student_id in str(v).lower() for k,v in record.items() if isinstance(v, str)):
                obs_record = record
                break
                
    if obs_record:
        profile["observation"] = obs_record
        profile["datasets_available"].append("observation")
    else:
        profile["observation"] = None
        
    # Derived RAG
    # Simple logic
    rag_color = "Red"
    score = 0
    if profile.get("assessment"):
        # find a score
        vals = [v for k,v in profile["assessment"].items() if isinstance(v, (int, float))]
        if vals:
            score = max(vals) # simplistic
            if score > 75: rag_color = "Green"
            elif score > 60: rag_color = "Amber"
            
    profile["rag_status"] = rag_color
    
    return profile
