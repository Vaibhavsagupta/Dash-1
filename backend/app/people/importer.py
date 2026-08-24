"""
Excel & CSV Student Import Engine with Column Auto-Detection & Smart Derivation (Phase 3)
"""

import io
import re
from typing import Dict, List, Any, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from .models import Student, StudentAcademicMapping, UserAccount
from ..curriculum.models import Program, Batch, AcademicSession
from ..auth import get_password_hash

COLUMN_MAPPINGS = {
    "enrollment_no": ["enrollment no", "enrollment_no", "enrollment", "student_id", "enrollmentno", "reg_no", "registration_no"],
    "scholar_no": ["scholar no", "scholar_no", "scholar", "scholarno"],
    "full_name": ["student name", "full_name", "fullname", "name", "student_name"],
    "gender": ["gender", "sex"],
    "email": ["email", "email_id", "emailid", "student_email"],
    "mobile": ["mobile", "mobile_no", "phone", "contact", "student_mobile"],
    "parent_name": ["parent name", "parent_name", "father_name", "father name", "guardian_name"],
    "parent_mobile": ["parent mobile", "parent_mobile", "father_mobile", "guardian_mobile"],
    "address": ["address", "city", "residence"],
    "blood_group": ["blood group", "blood_group", "bloodgroup"],
    "program_code": ["program", "branch", "course", "department", "degree"],
    "batch_year": ["batch", "batch_year", "admission_year", "year"],
    "current_semester": ["semester", "current_semester", "sem"]
}

def detect_columns(df: pd.DataFrame) -> Dict[str, str]:
    """Auto-detect Excel/CSV columns matching standard student fields."""
    found_map = {}
    df_cols_lower = {str(col).strip().lower(): str(col) for col in df.columns}

    for std_field, aliases in COLUMN_MAPPINGS.items():
        for alias in aliases:
            if alias in df_cols_lower:
                found_map[std_field] = df_cols_lower[alias]
                break
    return found_map

def derive_student_academic_info(enrollment_no: str, raw_prog: str = None, raw_batch: int = None, raw_sem: int = None) -> Tuple[str, int, int]:
    """
    Derive Batch Year, Program Code (AI, CSF, FSD), and Current Semester from Enrollment Code.
    Example: 23BTA3ARI10038 -> Batch 2023, Program AI, Current Semester 7.
    """
    en_clean = str(enrollment_no).upper().strip()
    
    # 1. Derive Batch Year
    batch_year = raw_batch
    if not batch_year:
        year_match = re.search(r'^(2[0-9])', en_clean)
        if year_match:
            short_year = int(year_match.group(1))
            batch_year = 2000 + short_year
        else:
            batch_year = 2023

    # 2. Derive Program Code
    prog_code = "AI"
    if raw_prog:
        p_str = str(raw_prog).upper()
        if "CSF" in p_str or "CYBER" in p_str or "FORENSIC" in p_str:
            prog_code = "CSF"
        elif "FSD" in p_str or "FULL" in p_str or "STACK" in p_str:
            prog_code = "FSD"
        elif "AI" in p_str or "ARI" in p_str or "ARTIFICIAL" in p_str:
            prog_code = "AI"
    else:
        if "ARI" in en_clean or "AI" in en_clean:
            prog_code = "AI"
        elif "CSF" in en_clean or "CYB" in en_clean:
            prog_code = "CSF"
        elif "FSD" in en_clean or "WEB" in en_clean:
            prog_code = "FSD"

    # 3. Derive Current Semester
    semester = raw_sem
    if not semester:
        # Assuming current academic year is 2025-26
        # Batch 2023 -> Semester 5 or 7
        if batch_year == 2023:
            semester = 7
        elif batch_year == 2022:
            semester = 8
        elif batch_year == 2021:
            semester = 8
        elif batch_year == 2020:
            semester = 8
        else:
            semester = 1

    return prog_code, batch_year, semester

def process_excel_student_import(db: Session, file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parse Excel/CSV file, validate duplicate records, derive academic fields, and import students into database."""
    ext = filename.split(".")[-1].lower()
    
    try:
        if ext in ["xlsx", "xls"]:
            df = pd.read_excel(io.BytesIO(file_bytes))
        elif ext == "csv":
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            raise ValueError(f"Unsupported file format '{filename}'. Allowed: XLSX, CSV.")
    except Exception as e:
        raise ValueError(f"Failed to read file: {e}")

    col_map = detect_columns(df)
    if "enrollment_no" not in col_map and "full_name" not in col_map:
        raise ValueError("Excel file must contain at least 'Enrollment No' and 'Student Name' columns.")

    total_rows = len(df)
    imported_count = 0
    duplicate_count = 0
    failed_count = 0

    duplicates = []
    failed_rows = []

    # Get cached programs & batches
    prog_dict = {p.code: p.id for p in db.query(Program).all()}
    batch_dict = {b.batch_year: b.id for b in db.query(Batch).all()}
    curr_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()
    sess_id = curr_session.id if curr_session else None

    # Pre-fetch existing unique fields for fast duplicate detection
    existing_enrollments = {s[0] for s in db.query(Student.enrollment_no).all()}
    existing_scholars = {s[0] for s in db.query(Student.scholar_no).filter(Student.scholar_no != None).all()}
    existing_emails = {s[0] for s in db.query(Student.email).filter(Student.email != None).all()}

    for row_idx, row in df.iterrows():
        try:
            en_val = str(row[col_map["enrollment_no"]]).strip() if "enrollment_no" in col_map and pd.notna(row[col_map["enrollment_no"]]) else f"GEN{2023000 + row_idx}"
            name_val = str(row[col_map["full_name"]]).strip() if "full_name" in col_map and pd.notna(row[col_map["full_name"]]) else f"Student {row_idx + 1}"
            sch_val = str(row[col_map["scholar_no"]]).strip() if "scholar_no" in col_map and pd.notna(row[col_map["scholar_no"]]) else None
            email_val = str(row[col_map["email"]]).strip() if "email" in col_map and pd.notna(row[col_map["email"]]) else f"{en_val.lower()}@sage.edu"
            mob_val = str(row[col_map["mobile"]]).strip() if "mobile" in col_map and pd.notna(row[col_map["mobile"]]) else None
            parent_name = str(row[col_map["parent_name"]]).strip() if "parent_name" in col_map and pd.notna(row[col_map["parent_name"]]) else None
            parent_mob = str(row[col_map["parent_mobile"]]).strip() if "parent_mobile" in col_map and pd.notna(row[col_map["parent_mobile"]]) else None
            gender = str(row[col_map["gender"]]).strip() if "gender" in col_map and pd.notna(row[col_map["gender"]]) else "Male"

            # Check Duplicate
            if en_val in existing_enrollments or (sch_val and sch_val in existing_scholars) or (email_val and email_val in existing_emails):
                duplicate_count += 1
                duplicates.append({
                    "row": row_idx + 2,
                    "enrollment_no": en_val,
                    "name": name_val,
                    "reason": "Enrollment number, Scholar number, or Email already registered."
                })
                continue

            # Derive Academic Fields
            raw_prog = str(row[col_map["program_code"]]) if "program_code" in col_map and pd.notna(row[col_map["program_code"]]) else None
            raw_batch = int(row[col_map["batch_year"]]) if "batch_year" in col_map and pd.notna(row[col_map["batch_year"]]) and str(row[col_map["batch_year"]]).isdigit() else None
            raw_sem = int(row[col_map["current_semester"]]) if "current_semester" in col_map and pd.notna(row[col_map["current_semester"]]) and str(row[col_map["current_semester"]]).isdigit() else None

            p_code, b_year, c_sem = derive_student_academic_info(en_val, raw_prog, raw_batch, raw_sem)

            # Ensure Program & Batch IDs
            p_id = prog_dict.get(p_code)
            if not p_id:
                new_p = Program(code=p_code, name=f"{p_code} Specialization", is_active=True)
                db.add(new_p)
                db.flush()
                p_id = new_p.id
                prog_dict[p_code] = p_id

            b_id = batch_dict.get(b_year)
            if not b_id:
                new_b = Batch(batch_year=b_year)
                db.add(new_b)
                db.flush()
                b_id = new_b.id
                batch_dict[b_year] = b_id

            # Create Student Record
            student = Student(
                enrollment_no=en_val,
                scholar_no=sch_val,
                full_name=name_val,
                gender=gender,
                email=email_val,
                mobile=mob_val,
                parent_name=parent_name,
                parent_mobile=parent_mob,
                batch_id=b_id,
                program_id=p_id,
                current_semester=c_sem,
                admission_year=b_year,
                status="ACTIVE"
            )
            db.add(student)
            db.flush()

            # Academic Mapping History Record
            db.add(StudentAcademicMapping(
                student_id=student.id,
                academic_session_id=sess_id,
                batch_id=b_id,
                program_id=p_id,
                semester=c_sem,
                promoted=True
            ))

            # User Account Login Record
            if not db.query(UserAccount).filter(UserAccount.email == email_val).first():
                db.add(UserAccount(
                    email=email_val,
                    password_hash=get_password_hash("student123"),
                    role="student",
                    linked_student=student.id,
                    is_active=True
                ))

            # Update cache trackers
            existing_enrollments.add(en_val)
            if sch_val:
                existing_scholars.add(sch_val)
            if email_val:
                existing_emails.add(email_val)

            imported_count += 1

        except Exception as r_err:
            failed_count += 1
            failed_rows.append({
                "row": row_idx + 2,
                "error": str(r_err)
            })

    db.commit()

    return {
        "total_rows": total_rows,
        "imported_count": imported_count,
        "duplicate_count": duplicate_count,
        "failed_count": failed_count,
        "duplicates": duplicates,
        "failed_rows": failed_rows
    }
