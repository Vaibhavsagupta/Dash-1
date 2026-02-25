import sys
import os
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import User, UserRole, Base, Student, Teacher, AttendanceLog, AttendanceStatus, Lecture, Unit, Alert, Submission, Assessment, RAGLog, Admin
from app.auth import get_password_hash

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Student data", "Student data")

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
    print("Initializing Database...")
    try:
        # Create all tables if they don't exist
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning during table creation: {e}")

    db = SessionLocal()

    # --- 0. Clear Existing Data ---
    print(f"Clearing existing data from {engine.url.drivername}...")
    try:
        # Delete in reverse order of foreign key dependencies
        db.query(RAGLog).delete()
        db.query(Alert).delete()
        db.query(Assessment).delete()
        db.query(AttendanceLog).delete()
        db.query(Submission).delete()
        db.query(Lecture).delete()
        db.query(Unit).delete()
        db.query(Student).delete()
        db.query(User).filter(User.role == UserRole.student).delete()
        # Keep admin and teacher users to avoid lockout, or re-add them later
        db.commit()
        print("Data cleared successfully.")
    except Exception as e:
        print(f"Error clearing data: {e}")
        db.rollback()


    # --- 1. Load Student Batch Info ---
    print("Loading Student Info...")
    batch_info_path = os.path.join(DATA_DIR, "student batch info.csv.xlsx")
    df_info = pd.read_excel(batch_info_path)
    
    students_map = {} 
    name_to_id = {}
    
    count = 0
    for index, row in df_info.iterrows():
        name = row.get("Name")
        if pd.isna(name): continue
        
        email = row.get("Email Address")
        if pd.isna(email): email = f"{clean_name(name).replace(' ', '')}@example.com"
        
        student_id = str(row.get("College Roll no/ University Roll no.", f"S{index+1}")).strip()
        if not student_id or student_id.lower() == "nan": student_id = f"S{index+1}"
        
        name_key = clean_name(name)
        name_to_id[name_key] = student_id
        
        if student_id not in students_map:
            students_map[student_id] = {
                "student_id": student_id,
                "name": name,
                "email": email,
                "attendance": 0,
                "dsa": 0,
                "ml": 0,
                "qa": 0,
                "mock": 0,
                "proj": 0,
                "start_date": row.get("Start Date"),
                "end_date": row.get("End Date")
            }
            count += 1
    print(f"Found {count} unique students in batch info.")

    # --- 2. Load Assessment Scores ---
    print("Loading Assessments...")
    ass_path = os.path.join(DATA_DIR, "assessment 1 2 3.xlsx")
    df_ass = pd.read_excel(ass_path, header=1)
    
    assessments_to_add = []

    def process_block(row, name_col, tech_col, verbal_col, math_col, logic_col, ass_name):
        name = row.get(name_col)
        if pd.isna(name): return
        key = clean_name(name)
        s_id = name_to_id.get(key)
        if s_id and s_id in students_map:
            s = students_map[s_id]
            if "scores_dsa" not in s: s["scores_dsa"] = []
            if "scores_ml" not in s: s["scores_ml"] = []
            if "scores_qa" not in s: s["scores_qa"] = []
            if "scores_mock" not in s: s["scores_mock"] = []
            
            tech = safe_int(row.get(tech_col))
            math = safe_int(row.get(math_col))
            logic = safe_int(row.get(logic_col))
            verbal = safe_int(row.get(verbal_col))
            
            s["scores_dsa"].append(tech)
            s["scores_ml"].append(math)
            s["scores_qa"].append(logic)
            s["scores_mock"].append(verbal)

            # Create Assessment record
            assessments_to_add.append(Assessment(
                student_id=s_id,
                assessment_name=ass_name,
                technical_score=float(tech),
                verbal_score=float(verbal),
                math_score=float(math),
                logic_score=float(logic),
                total_score=float(tech + math + logic + verbal),
                percentage=float((tech + math + logic + verbal) / 4.0)
            ))

    for index, row in df_ass.iterrows():
        process_block(row, "Name", "Technical", "Verbal", "Maths/Numerical", "Logical Leasoning", "Assessment 1")
        process_block(row, "Name.1", "Technical.1", "Verbal.1", "Maths/Numerical.1", "Logical Leasoning.1", "Assessment 2")
        if "Name.2" in df_ass.columns:
             process_block(row, "Name.2", "Technical.2", "Verbal.2", "Maths/Numerical.2", "Logical Leasoning.2", "Assessment 3")

    # --- 2.1 Fill Missing Assessments with Synthetic Data ---
    # Find students who got no assessments from the file
    students_with_assessments = set(a.student_id for a in assessments_to_add)
    all_student_ids = set(students_map.keys())
    missing_ids = all_student_ids - students_with_assessments
    
    print(f"Generating synthetic assessments for {len(missing_ids)} students...")
    import random
    
    for s_id in missing_ids:
        # Generate 2 or 3 assessments
        for i in range(1, 4):
            tech = random.randint(50, 95)
            verbal = random.randint(50, 95) 
            math = random.randint(50, 95)
            logic = random.randint(50, 95)
            total = tech + verbal + math + logic
            
            assessments_to_add.append(Assessment(
                student_id=s_id,
                assessment_name=f"Assessment {i}",
                technical_score=float(tech),
                verbal_score=float(verbal),
                math_score=float(math),
                logic_score=float(logic),
                total_score=float(total),
                percentage=float(total / 4.0)
            ))
            
            # Also update the aggregate map so the main student card isn't empty
            if s_id in students_map:
                s = students_map[s_id]
                if "scores_dsa" not in s: s["scores_dsa"] = []
                if "scores_ml" not in s: s["scores_ml"] = []
                if "scores_qa" not in s: s["scores_qa"] = []
                if "scores_mock" not in s: s["scores_mock"] = []
                
                s["scores_dsa"].append(tech)
                s["scores_ml"].append(math)
                s["scores_qa"].append(logic)
                s["scores_mock"].append(verbal)

    # Aggregate scores
    for s_id, s in students_map.items():
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
                s_id = name_to_id.get(key)
                if not s_id or s_id not in students_map: continue
                
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
                                    student_id=s_id,
                                    date=date_val,
                                    status=status_enum
                                ))
                        except: pass
                
                if total_days > 0:
                    att_pct = int((p_count / total_days) * 100)
                    students_map[s_id]["attendance"] = att_pct
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
                "score": "score",
                "remarks": "remarks",
                "status": "status",
                "batch_id": "batch"
            }
            
            update_count = 0
            for idx, row in df.iterrows():
                name = row.get(name_col)
                if pd.isna(name): continue
                
                key = clean_name(name)
                s_id = name_to_id.get(key)
                if s_id and s_id in students_map:
                    try:
                        for field, col_term in field_map.items():
                            # Partial match for columns
                            col_name = next((c for c in df.columns if col_term in c.lower()), None)
                            if col_name:
                                val = row.get(col_name)
                                db_key = f"{prefix}_{field}" if field != "score" else f"{prefix}_score"
                                if field in ["remarks", "status", "batch_id"]:
                                    students_map[s_id][db_key] = str(val) if not pd.isna(val) else None
                                else:
                                    students_map[s_id][db_key] = float(val) if not pd.isna(val) else 0.0
                        
                        update_count += 1
                    except Exception as e: 
                        print(f"Error updating student {name}: {e}")
            print(f"Updated {update_count} students from {filename}")
        except Exception as e: print(f"Error {filename}: {e}")

    process_obs("pre observation.csv.xlsx", "pre")
    process_obs("post observation.csv.xlsx", "post")
    
    # --- 5. RAG Status ---
    print("Loading RAG Analysis...")
    rag_logs_to_add = []
    rag_path = os.path.join(DATA_DIR, "rag analysis.csv.xlsx")
    
    if os.path.exists(rag_path):
        df_rag = pd.read_excel(rag_path)
        
        # Identify Columns
        name_col_rag = next((c for c in df_rag.columns if "Name" in c), "Name")
        final_rag_col = next((c for c in df_rag.columns if "Final RAG" in str(c) or "RAG Status" in str(c)), None)
        
        # Identify date columns (assume anything containing a month or date range like 'July', 'Aug', '-')
        # Excluding known non-date columns
        non_date_cols = ["S.No.", "Name", "Name ", "Final RAG", "Unnamed", "nan"]
        date_cols = [
            c for c in df_rag.columns 
            if not any(x in str(c) for x in non_date_cols) and "Unnamed" not in str(c)
        ]
        
        print(f"Detected RAG Date Columns: {date_cols}")
        
        for idx, row in df_rag.iterrows():
            name = row.get(name_col_rag)
            if pd.isna(name): continue
            key = clean_name(name)
            s_id = name_to_id.get(key)
            
            if s_id and s_id in students_map:
                # 1. Set Final Status
                if final_rag_col:
                    val = str(row.get(final_rag_col)).strip()
                    if val.lower() != "nan":
                        students_map[s_id]["rag_status"] = val
                
                # 2. Create Historical Logs
                for d_col in date_cols:
                    status_val = str(row.get(d_col)).strip()
                    if not status_val or status_val.lower() == "nan": continue
                    
                    # Try to parse a meaningful date from the column header string
                    # e.g. "July 28 - Aug 2" -> Use start date year 2025
                    # Simple heuristic: Just use an incrementing date for visualization if parsing fails, 
                    # OR, better: try to parse the first month/day.
                    # For now, let's just store the column name as 'period_name' and pick a date.
                    
                    # Hacky Date Parser for "Month DD"
                    try:
                        import datetime
                        # Cleaning: "July 28" -> 2025-07-28
                        date_str = str(d_col).split("-")[0].strip() # Take start part
                        # Remove ordinal suffixes like 1st, 2nd if any (not present in example)
                        
                        # Fallback for "July 28" parsing
                        # We'll use the column name as the reference date
                        # Let's import dateutil parser if possible, or manual map
                        # Manual Map for months
                        months = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, 
                                  "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}
                        
                        m_str = date_str[:3].lower()
                        day_part = ''.join(filter(str.isdigit, date_str))
                        if not day_part: day_part = "1"
                        
                        month_num = months.get(m_str, 1) # default Jan if fail
                        
                        log_date = pd.Timestamp(year=2025, month=month_num, day=int(day_part)).date()
                        
                        # from app.models import RAGLog
                        rag_logs_to_add.append(RAGLog(
                            student_id=s_id,
                            date=log_date,
                            status=status_val,
                            period_name=str(d_col)
                        ))
                    except Exception as e:
                        # Fallback if date parsing fails entirely
                        pass
    


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
    
    added_emails = set()
    added_student_ids = set()
    
    # Add Students & Users
    for s_id_raw, data in students_map.items():
        s_id = str(s_id_raw).strip().upper()
        if s_id in added_student_ids:
            continue
            
        import random
        student = Student(
            student_id=s_id,
            name=data["name"],
            attendance=data.get("attendance", 75),
            dsa_score=data["dsa"],
            ml_score=data["ml"],
            qa_score=data["qa"],
            projects_score=random.randint(60, 95),
            mock_interview_score=data["mock"],
            batch_id=data.get("pre_batch_id") or data.get("post_batch_id") or "Batch 1",
            pre_score=data.get("pre_score", 0.0),
            post_score=data.get("post_score", 0.0),
            pre_communication=data.get("pre_communication", 0.0),
            pre_engagement=data.get("pre_engagement", 0.0),
            pre_subject_knowledge=data.get("pre_subject_knowledge", 0.0),
            pre_confidence=data.get("pre_confidence", 0.0),
            pre_fluency=data.get("pre_fluency", 0.0),
            pre_remarks=data.get("pre_remarks"),
            post_communication=data.get("post_communication", 0.0),
            post_engagement=data.get("post_engagement", 0.0),
            post_subject_knowledge=data.get("post_subject_knowledge", 0.0),
            post_confidence=data.get("post_confidence", 0.0),
            post_fluency=data.get("post_fluency", 0.0),
            post_remarks=data.get("post_remarks"),
            pre_status=data.get("pre_status"),
            post_status=data.get("post_status"),
            rag_status=data.get("rag_status", "Green"),
            start_date=pd.to_datetime(data["start_date"]).date() if pd.notna(data.get("start_date")) else None,
            end_date=pd.to_datetime(data["end_date"]).date() if pd.notna(data.get("end_date")) else None
        )
        db.add(student)
        added_student_ids.add(s_id)
        
        email = str(data["email"]).lower().strip()
        if email not in added_emails:
            user = User(
                email=email,
                password_hash=get_password_hash("password123"),
                role=UserRole.student,
                linked_id=s_id
            )
            db.add(user)
            added_emails.add(email)
    
    # Admin/Teacher
    for admin_email in ["admin@example.com"]:
        if admin_email not in added_emails:
            if not db.query(User).filter(User.email == admin_email).first():
                db.add(User(email=admin_email, password_hash=get_password_hash("admin"), role=UserRole.admin, approved=True))
            added_emails.add(admin_email)
            
    # Permanent Super Admin
    super_email = "vaibhav@gmail.com"
    if super_email not in added_emails:
        if not db.query(User).filter(User.email == super_email).first():
            db.add(User(email=super_email, password_hash=get_password_hash("Vaibhav"), role=UserRole.admin, approved=True))
            # Also add to dedicated Admin table for super-admin privileges
            if not db.query(Admin).filter(Admin.email == super_email).first():
                db.add(Admin(email=super_email, password=get_password_hash("Vaibhav"), is_super_admin=True, approved=True))
        added_emails.add(super_email)
            
    for teacher_email in ["teacher@example.com"]:
        if teacher_email not in added_emails:
            if not db.query(User).filter(User.email == teacher_email).first():
                db.add(User(email=teacher_email, password_hash=get_password_hash("password"), role=UserRole.teacher, linked_id="T01", approved=True))
            added_emails.add(teacher_email)


    if not db.query(Teacher).filter(Teacher.teacher_id == "T01").first():
        db.add(Teacher(teacher_id="T01", name="Prof. Teacher", subject="CS", avg_improvement=15.0, feedback_score=4.5, content_quality_score=4.2, placement_conversion=20.0))

    # Flush to ensure students/teachers exist before FK-linked records
    db.flush()

    # Add Lectures/Units
    for l in lectures_to_add: db.add(l)
    for u in units_to_add: db.add(u)
    for a in assessments_to_add: 
        sid = str(a.student_id).strip().upper()
        if sid in added_student_ids:
            a.student_id = sid
            db.add(a)
    
    # Add Attendance Logs
    print(f"Adding {len(attendance_logs_to_add)} attendance logs...")
    for log in attendance_logs_to_add:
        sid = str(log.student_id).strip().upper()
        if sid in added_student_ids:
            log.student_id = sid
            db.add(log)

    # Add RAG Logs
    print(f"Adding {len(rag_logs_to_add)} RAG logs...")
    # First clear existing to avoid duplicates if re-seeding
    db.query(RAGLog).delete()
    for log in rag_logs_to_add:
        sid = str(log.student_id).strip().upper()
        if sid in added_student_ids:
            log.student_id = sid
            db.add(log)

    try:
        print("Committing transaction to Supabase...")
        db.commit()
        print("Database seeding completed.")
    except Exception as e:
        print(f"CRITICAL ERROR during commit: {str(e)}")
        db.rollback()
        raise


    
    db.close()

if __name__ == "__main__":
    seed_real_data()

