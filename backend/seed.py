import sys
import os
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import User, UserRole, Base, Student, Teacher, AttendanceLog, AttendanceStatus, Lecture, Unit, Alert, Submission
from app.auth import get_password_hash

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Student Data")

def clean_name(name):
    if pd.isna(name):
        return ""
    return str(name).strip().lower()

def safe_int(val, default=0):
    try:
        if pd.isna(val):
            return default
        return int(float(val))
    except:
        return default

def seed_real_data():
    # Remove DB file to reset schema (simplest way to enforce new columns)
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.db")
    # if os.path.exists(db_path):
    #     try:
    #          # os.remove(db_path)
    #          pass
    #     except Exception as e:
    #          print(f"Could not remove DB file: {e}")

    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # --- 0. Clear Existing Data ---
    print("Clearing existing data...")
    try:
        db.query(Alert).delete()
        db.query(AttendanceLog).delete()
        db.query(Submission).delete()
        db.query(Lecture).delete()
        db.query(Unit).delete()
        db.query(Student).delete()
        db.query(User).filter(User.role == UserRole.student).delete()
        # db.query(Teacher).delete() # Keep T01 if possible, or recreate
        db.commit()
        print("Data cleared.")
    except Exception as e:
        print(f"Error clearing data: {e}")
        db.rollback()

    # --- 1. Load Student Batch Info ---
    print("Loading Student Info...")
    batch_info_path = os.path.join(DATA_DIR, "student batch info.csv.xlsx")
    df_info = pd.read_excel(batch_info_path)
    
    students_map = {} 
    
    count = 0
    for index, row in df_info.iterrows():
        name = row.get("Name")
        if pd.isna(name): continue
        
        email = row.get("Email Address")
        if pd.isna(email): email = f"{clean_name(name).replace(' ', '')}@example.com"
        
        student_id = str(row.get("College Roll no/ University Roll no.", f"S{index+1}"))
        if pd.isna(student_id): student_id = f"S{index+1}"
        
        students_map[clean_name(name)] = {
            "student_id": student_id,
            "name": name,
            "email": email,
            "attendance": 0,
            "dsa": 0,
            "ml": 0,
            "qa": 0,
            "mock": 0,
            "proj": 0
        }
        count += 1
    print(f"Found {count} students in batch info.")

    # --- 2. Load Assessment Scores ---
    print("Loading Assessments...")
    ass_path = os.path.join(DATA_DIR, "assessment.xlsx")
    df_ass = pd.read_excel(ass_path, header=1)
    
    def process_block(row, name_col, tech_col, verbal_col, math_col, logic_col):
        name = row.get(name_col)
        if pd.isna(name): return
        key = clean_name(name)
        if key in students_map:
            s = students_map[key]
            if "scores_dsa" not in s: s["scores_dsa"] = []
            if "scores_ml" not in s: s["scores_ml"] = []
            if "scores_qa" not in s: s["scores_qa"] = []
            if "scores_mock" not in s: s["scores_mock"] = []
            
            s["scores_dsa"].append(safe_int(row.get(tech_col)))
            s["scores_ml"].append(safe_int(row.get(math_col)))
            s["scores_qa"].append(safe_int(row.get(logic_col)))
            s["scores_mock"].append(safe_int(row.get(verbal_col)))

    for index, row in df_ass.iterrows():
        process_block(row, "Name", "Technical", "Verbal", "Maths/Numerical", "Logical Leasoning")
        process_block(row, "Name.1", "Technical.1", "Verbal.1", "Maths/Numerical.1", "Logical Leasoning.1")
        if "Name.2" in df_ass.columns:
             process_block(row, "Name.2", "Technical.2", "Verbal.2", "Maths/Numerical.2", "Logical Leasoning.2")

    # Aggregate scores
    for key, s in students_map.items():
        if "scores_dsa" in s and s["scores_dsa"]:
            s["dsa"] = int(sum(s["scores_dsa"]) / len(s["scores_dsa"]))
            s["ml"] = int(sum(s["scores_ml"]) / len(s["scores_ml"]))
            s["qa"] = int(sum(s["scores_qa"]) / len(s["scores_qa"]))
            s["mock"] = int(sum(s["scores_mock"]) / len(s["scores_mock"]))
        else:
            import random
            s["dsa"] = random.randint(60, 90)
            s["ml"] = random.randint(60, 90)
            s["qa"] = random.randint(60, 90)
            s["mock"] = random.randint(60, 90)
        s["proj"] = 0

    # --- 3. Load Attendance ---
    print("Loading Attendance...")
    att_path = os.path.join(DATA_DIR, "attendance sheet.csv.xlsx")
    attendance_logs_to_add = []
    
    try:
        df_att = pd.read_excel(att_path, header=3)
        name_col = next((c for c in df_att.columns if "Name" in str(c)), None)
        
        if name_col:
            cols = list(df_att.columns)
            name_idx = cols.index(name_col)
            date_cols = cols[name_idx+1:]
            
            for index, row in df_att.iterrows():
                name_val = row.get(name_col)
                if pd.isna(name_val): continue
                if str(name_val).strip().lower() in ["name", "nan", ""]: continue
                
                key = clean_name(name_val)
                if key not in students_map: continue
                
                student_id_val = students_map[key]["student_id"]
                p_count = 0
                total_days = 0

                for col in date_cols:
                    status_raw = str(row.get(col)).upper().strip()
                    status_enum = None
                    if status_raw in ['P', 'PRESENT']:
                        status_enum = AttendanceStatus.present
                        p_count += 1
                        total_days += 1
                    elif status_raw in ['A', 'ABSENT', 'L']: 
                        status_enum = AttendanceStatus.absent
                        total_days += 1
                    
                    if status_enum:
                        try:
                            day_num = int(float(col))
                            if 1 <= day_num <= 31:
                                date_val = pd.Timestamp(year=2025, month=1, day=day_num).date()
                                attendance_logs_to_add.append(AttendanceLog(
                                    student_id=student_id_val,
                                    date=date_val,
                                    status=status_enum
                                ))
                        except: pass
                
                if total_days > 0:
                    att_pct = int((p_count / total_days) * 100)
                    students_map[key]["attendance"] = att_pct
    except Exception as e:
        print(f"Error loading attendance: {e}")
    
    print("Loading Progression...")
    def process_obs(filename, prefix):
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path): return
        try:
            df = pd.read_excel(path, header=1)
            # Normalize columns: strip whitespace and lower case for matching
            df.columns = df.columns.astype(str).str.strip()
            cols = {c.lower(): c for c in df.columns}
            
            name_col = next((c for c in df.columns if "Name" in c), "Name")
            
            # Map of internal field names to spreadsheet column terms
            field_map = {
                "communication": "communication",
                "engagement": "engagement",
                "subject_knowledge": "subject knowledge",
                "confidence": "confidence",
                "fluency": "fluency",
                "score": "score"
            }
            
            update_count = 0
            for idx, row in df.iterrows():
                name = row.get(name_col)
                if pd.isna(name): continue
                
                key = clean_name(name)
                if key in students_map:
                    try:
                        for field, col_term in field_map.items():
                            col_name = cols.get(col_term)
                            if col_name:
                                db_key = f"{prefix}_{field}" if field != "score" else f"{prefix}_score"
                                val = row.get(col_name)
                                students_map[key][db_key] = float(val) if not pd.isna(val) else 0.0
                        
                        # Store Status
                        status_col = cols.get("status")
                        if status_col:
                            students_map[key][f"{prefix}_status"] = str(row.get(status_col))
                        
                        update_count += 1
                    except: pass
            print(f"Updated {update_count} students from {filename}")
        except Exception as e: print(f"Error {filename}: {e}")

    process_obs("pre observation.csv.xlsx", "pre")
    process_obs("post observation.csv.xlsx", "post")
    
    # --- 5. RAG Status ---
    rag_path = os.path.join(DATA_DIR, "rag analysis.csv.xlsx")
    if os.path.exists(rag_path):
        df_rag = pd.read_excel(rag_path)
        rag_col = next((c for c in df_rag.columns if "RAG" in c), None)
        name_col_rag = next((c for c in df_rag.columns if "Name" in c), "Name")
        if rag_col:
            for idx, row in df_rag.iterrows():
                name = row.get(name_col_rag)
                if pd.isna(name): continue
                key = clean_name(name)
                if key in students_map:
                    students_map[key]["rag_status"] = str(row.get(rag_col)).strip()

    # --- 6. Schedule / Lectures ---
    print("Loading Schedule...")
    lectures_to_add = []
    units_to_add = []
    
    sched_path = os.path.join(DATA_DIR, "schedule.csv.xlsx")
    if os.path.exists(sched_path):
        df_sch = pd.read_excel(sched_path)
        time_cols = [c for c in df_sch.columns if "Date" not in str(c) and "Day" not in str(c) and "Unnamed" not in str(c)]
        for idx, row in df_sch.iterrows():
            date_val = row.get("Date")
            try: date_obj = pd.to_datetime(date_val).date()
            except: continue
            for t_col in time_cols:
                topic = row.get(t_col)
                if pd.isna(topic) or str(topic).lower() == "nan": continue
                time_str = str(t_col).strip()
                s_t = time_str.split("-")[0].strip() if "-" in time_str else time_str
                e_t = time_str.split("-")[1].strip() if "-" in time_str else ""
                lectures_to_add.append(Lecture(
                    teacher_id="T01", batch="Batch 1", subject="General", topic=str(topic).strip(),
                    room="Online", start_time=s_t, end_time=e_t, date=date_obj
                ))

    # Agenda
    agenda_path = os.path.join(DATA_DIR, "Agenda.csv.xlsx")
    if os.path.exists(agenda_path):
        df_ag = pd.read_excel(agenda_path, header=1)
        for idx, row in df_ag.iterrows():
            topic = row.get("Topic")
            if pd.isna(topic): continue
            units_to_add.append(Unit(
                teacher_id="T01", unit_number=safe_int(row.get("S.No."), idx+1),
                title=str(topic), status="Pending", progress=0
            ))

    # --- 7. Save to DB ---
    print("Saving to DB...")
    
    # Add Students & Users
    for key, data in students_map.items():
        import random
        student = Student(
            student_id=data["student_id"],
            name=data["name"],
            attendance=data.get("attendance", 75),
            dsa_score=data["dsa"],
            ml_score=data["ml"],
            qa_score=data["qa"],
            projects_score=random.randint(60, 95),
            mock_interview_score=data["mock"],
            pre_score=data.get("pre_score", 0.0),
            post_score=data.get("post_score", 0.0),
            pre_communication=data.get("pre_communication", 0.0),
            pre_engagement=data.get("pre_engagement", 0.0),
            pre_subject_knowledge=data.get("pre_subject_knowledge", 0.0),
            pre_confidence=data.get("pre_confidence", 0.0),
            pre_fluency=data.get("pre_fluency", 0.0),
            post_communication=data.get("post_communication", 0.0),
            post_engagement=data.get("post_engagement", 0.0),
            post_subject_knowledge=data.get("post_subject_knowledge", 0.0),
            post_confidence=data.get("post_confidence", 0.0),
            post_fluency=data.get("post_fluency", 0.0),
            pre_status=data.get("pre_status"),
            post_status=data.get("post_status"),
            rag_status=data.get("rag_status", "Green")
        )
        db.add(student)
        
        user = db.query(User).filter(User.email == data["email"]).first()
        if not user:
            user = User(
                email=data["email"],
                password_hash=get_password_hash("password123"),
                role=UserRole.student,
                linked_id=data["student_id"]
            )
            db.add(user)
    
    # Admin/Teacher
    if not db.query(User).filter(User.email == "admin@example.com").first():
        db.add(User(email="admin@example.com", password_hash=get_password_hash("admin"), role=UserRole.admin))
    if not db.query(User).filter(User.email == "teacher@example.com").first():
        db.add(User(email="teacher@example.com", password_hash=get_password_hash("password"), role=UserRole.teacher, linked_id="T01"))
    if not db.query(Teacher).filter(Teacher.teacher_id == "T01").first():
        db.add(Teacher(teacher_id="T01", name="Prof. Teacher", subject="CS", avg_improvement=15.0, feedback_score=4.5, content_quality_score=4.2, placement_conversion=20.0))

    # Add Lectures/Units
    for l in lectures_to_add: db.add(l)
    for u in units_to_add: db.add(u)
    
    # Add Attendance Logs (NOW safe as students are added to session)
    print(f"Adding {len(attendance_logs_to_add)} attendance logs...")
    for log in attendance_logs_to_add:
        db.add(log)

    try:
        db.commit()
        print("Database seeding completed.")
    except Exception as e:
        print(f"Error committing: {e}")
        db.rollback()
    
    db.close()

if __name__ == "__main__":
    seed_real_data()

