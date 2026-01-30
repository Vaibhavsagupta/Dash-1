from app.analytics.assessment import analyze_assessment
from app.analytics.attendance import analyze_attendance
from app.analytics.observation import analyze_observation
import pandas as pd

def get_all_students():
    # 1. Fetch all raw data
    ass_data = analyze_assessment()
    att_data = analyze_attendance()
    obs_data = analyze_observation()
    
    students_map = {}
    
    # 0. Fetch Master List (Student Batch Info) if available
    from app.core.database import SessionLocal, engine
    from app.models.sys_metadata import UploadHistory
    
    session = SessionLocal()
    master_list = []
    try:
        # distinct student_info
        record = session.query(UploadHistory).filter(UploadHistory.dataset_type == "student_info").order_by(UploadHistory.upload_time.desc()).first()
        if record:
            df_master = pd.read_sql_table(record.table_name, engine)
            # Find Name/ID
            cols = [c.lower() for c in df_master.columns]
            name_col = next((c for c in df_master.columns if "name" in c.lower()), None)
            id_col = next((c for c in df_master.columns if "roll" in c.lower() or "id" in c.lower() or "enroll" in c.lower()), name_col)
            
            if name_col:
                # Filter empty
                df_master = df_master[df_master[name_col].notna() & (df_master[name_col].astype(str).str.strip() != "")]
                for _, row in df_master.iterrows():
                    master_list.append({
                        "name": str(row[name_col]).strip(),
                        "id": str(row[id_col]).strip() if id_col else str(row[name_col]).strip()
                    })
    except Exception as e:
        print(f"Error fetching master list: {e}")
    finally:
        session.close()

    # Initialize Map from Master List
    if master_list:
        for m in master_list:
            students_map[m["name"]] = {
                "student_id": m["id"],
                "name": m["name"],
                "prs_score": 0, "rank": 999, "percentile": 0, "attendance": 0,
                "dsa": 0, "ml": 0, "qa": 0, "projects": 0, "mock": 0,
                "pre_score": 0, "post_score": 0
            }

    # 1. Fetch all raw data (Assessment, Attendance, Observation)
    ass_data = analyze_assessment()
    att_data = analyze_attendance()
    obs_data = analyze_observation()
    
    # 2. Process Assessment
    # assess_data["all_students"] contains list of dicts with 'name', 'percentage', 'rank', subject scores
    for s in ass_data.get("all_students", []):
        name = s.get("name", "Unknown")
        
        # Fuzzy match or direct match
        # For now, assumes names match
        if name in students_map:
            target = students_map[name]
        else:
            # New student found in assessment (not in master list)
            target = {
                "student_id": name,
                "name": name,
                "attendance": 0, "pre_score": 0, "post_score": 0
            }
            students_map[name] = target

        # Enrich target
        target["prs_score"] = s.get("percentage", 0)
        target["rank"] = s.get("rank", 999)
        target["percentile"] = s.get("percentile", 0)
        
        # Normalize scores with distinct keys from Assessment file
        # Columns found: Technical, Verbal, Maths/Numerical, Logical Leasoning
        dsa = 0; ml = 0; qa = 0; mock = 0; projects = 0
        
        for k, v in s.items():
            k_lower = str(k).lower()
            if not isinstance(v, (int, float)): continue
            
            if "technical" in k_lower: dsa = v # Map Technical to DSA
            elif "verbal" in k_lower: qa = max(qa, v) # Map Verbal to QA
            elif "math" in k_lower: qa = max(qa, v) # Map Math to QA (pick max)
            elif "logical" in k_lower: ml = v # Map Logical to ML (Just for visualization slot)
            elif "mock" in k_lower: mock = v
            elif "project" in k_lower: projects = v
            
        target["dsa"] = dsa
        target["ml"] = ml
        target["qa"] = qa
        target["projects"] = projects
        target["mock"] = mock

    # 3. Process Attendance
    for s in att_data.get("student_details", []):
        name = s.get("name", "Unknown")
        att_val = s.get("attendance_percentage", 0)
        
        # Fallback: check for unnamed columns that might be attendance
        # In the specific sheet, Col 36 (approx index 36) is percentage.
        # But here 's' is a dictionary row from 'analyze_attendance'.
        # 'analyze_attendance' calculates percentage if not found?
        # Let's check 'attendance.py'.
        # If 'attendance.py' failed to find column, it might return 0.
        
        if name in students_map:
            students_map[name]["attendance"] = att_val
        elif not master_list: # Only add if no master list (avoid duplicates if fuzzy match fails)
             students_map[name] = {
                "student_id": name,
                "name": name,
                "prs_score": 0, "rank": 999, "percentile": 0,
                "attendance": s.get("attendance_percentage", 0),
                "dsa": 0, "ml": 0, "qa": 0, "projects": 0, "mock": 0,
                "pre_score": 0, "post_score": 0
            }

    # 4. Process Observation
    for s in obs_data.get("student_growth_data", []):
        name = s.get("name", "Unknown")
        if name in students_map:
            students_map[name]["pre_score"] = s.get("pre", 0)
            students_map[name]["post_score"] = s.get("post", 0)
    
    # Convert to list
    result = list(students_map.values())
    
    if not result:
        # Return a structure that tells the UI to show an upload prompt
        return [{"status": "no_data", "message": "No students found. Please upload student info dataset."}]
        
    return result
