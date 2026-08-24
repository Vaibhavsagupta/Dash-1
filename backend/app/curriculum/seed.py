"""
Curriculum OS Database Seeder
Populates Programs, Semester Templates, Course Slots, Courses, Batches, and Academic Sessions.
"""

from sqlalchemy.orm import Session
from .models import (
    Program, SemesterTemplate, CourseSlot, Course,
    CurriculumVersion, Batch, AcademicSession, CurriculumAudit
)
from .constants import (
    PROGRAMS, SEMESTER_MARKS, BATCHES, ACADEMIC_SESSIONS,
    BASE_SLOTS, PROGRAM_SPECIALIZATIONS
)

from sqlalchemy import text

def seed_curriculum(db: Session):
    print("[Curriculum Seeder] Verifying and seeding Curriculum OS data...")
    try:
        # Sync columns for courses table if migrating from legacy schema
        try:
            db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS id VARCHAR(36);"))
            db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_id INT;"))
            db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS slot_id INT;"))
            db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS theory_marks INT DEFAULT 0;"))
            db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS practical_marks INT DEFAULT 0;"))
            db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS internal_marks INT DEFAULT 0;"))
            db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS external_marks INT DEFAULT 0;"))
            db.execute(text("ALTER TABLE courses ALTER COLUMN department DROP NOT NULL;"))
            db.execute(text("ALTER TABLE courses ALTER COLUMN credits DROP NOT NULL;"))
            db.execute(text("ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_pkey CASCADE;"))
            db.commit()
        except Exception as alter_err:
            print(f"[Curriculum Seeder] Note during schema migration: {alter_err}")
            db.rollback()
        # 1. Programs
        prog_map = {}
        for code, name in PROGRAMS:
            prog = db.query(Program).filter(Program.code == code).first()
            if not prog:
                prog = Program(code=code, name=name, is_active=True)
                db.add(prog)
                db.flush()
            prog_map[code] = prog

        # 2. Semester Templates
        for sem, marks in SEMESTER_MARKS.items():
            sem_temp = db.query(SemesterTemplate).filter(SemesterTemplate.semester == sem).first()
            if not sem_temp:
                sem_temp = SemesterTemplate(semester=sem, total_marks=marks)
                db.add(sem_temp)
                db.flush()

        # 3. Batches
        for b_year in BATCHES:
            batch = db.query(Batch).filter(Batch.batch_year == b_year).first()
            if not batch:
                db.add(Batch(batch_year=b_year))

        # 4. Academic Sessions
        for sess in ACADEMIC_SESSIONS:
            existing_sess = db.query(AcademicSession).filter(AcademicSession.session_name == sess["session_name"]).first()
            if not existing_sess:
                db.add(AcademicSession(session_name=sess["session_name"], is_current=sess["is_current"]))

        # 5. Course Slots & Courses per Program
        slot_map = {} # (semester, slot_code) -> slot_id
        for sem, slots in BASE_SLOTS.items():
            for slot_info in slots:
                slot = db.query(CourseSlot).filter(
                    CourseSlot.semester == sem,
                    CourseSlot.slot_code == slot_info["slot_code"]
                ).first()
                if not slot:
                    slot = CourseSlot(
                        semester=sem,
                        slot_code=slot_info["slot_code"],
                        slot_name=slot_info["slot_name"],
                        slot_type=slot_info["slot_type"],
                        max_marks=slot_info["max_marks"],
                        is_specialization=slot_info["is_specialization"],
                        is_generic_elective=slot_info["is_generic_elective"],
                        display_order=slot_info["display_order"]
                    )
                    db.add(slot)
                    db.flush()
                else:
                    slot.max_marks = slot_info["max_marks"]
                slot_map[(sem, slot_info["slot_code"])] = slot.id

        # 6. Insert Courses for AI, CSF, FSD across Semesters 1–8
        for p_code, prog_obj in prog_map.items():
            for sem, slots in BASE_SLOTS.items():
                for slot_info in slots:
                    s_code = slot_info["slot_code"]
                    slot_id = slot_map.get((sem, s_code))

                    if slot_info["is_specialization"] and s_code in PROGRAM_SPECIALIZATIONS.get(p_code, {}):
                        spec_info = PROGRAM_SPECIALIZATIONS[p_code][s_code]
                        c_code = spec_info["code"]
                        c_name = spec_info["name"]
                        th_marks = spec_info["theory"]
                        pr_marks = spec_info["practical"]
                        in_marks = spec_info["internal"]
                        ex_marks = spec_info["external"]
                    else:
                        c_code = s_code
                        c_name = slot_info["slot_name"]
                        max_m = slot_info["max_marks"]
                        if slot_info["slot_type"] == "Theory":
                            th_marks, pr_marks, in_marks, ex_marks = max_m, 0, int(max_m * 0.3), int(max_m * 0.7)
                        elif slot_info["slot_type"] == "Practical":
                            th_marks, pr_marks, in_marks, ex_marks = 0, max_m, int(max_m * 0.4), int(max_m * 0.6)
                        elif slot_info["slot_type"] == "Project":
                            th_marks, pr_marks, in_marks, ex_marks = 0, max_m, int(max_m * 0.5), int(max_m * 0.5)
                        else: # Theory+Practical
                            th_marks, pr_marks, in_marks, ex_marks = 100, 50, 40, 110

                    existing_course = db.query(Course).filter(
                        Course.program_id == prog_obj.id,
                        Course.semester == sem,
                        Course.course_code == c_code
                    ).first()

                    if not existing_course:
                        db.add(Course(
                            program_id=prog_obj.id,
                            semester=sem,
                            slot_id=slot_id,
                            course_code=c_code,
                            course_name=c_name,
                            theory_marks=th_marks,
                            practical_marks=pr_marks,
                            internal_marks=in_marks,
                            external_marks=ex_marks
                        ))
                    else:
                        existing_course.slot_id = slot_id
                        existing_course.theory_marks = th_marks
                        existing_course.practical_marks = pr_marks
                        existing_course.internal_marks = in_marks
                        existing_course.external_marks = ex_marks

            # 7. Curriculum Version per program/semester
            for sem in range(1, 9):
                version = db.query(CurriculumVersion).filter(
                    CurriculumVersion.program_id == prog_obj.id,
                    CurriculumVersion.semester == sem
                ).first()
                if not version:
                    db.add(CurriculumVersion(
                        program_id=prog_obj.id,
                        semester=sem,
                        academic_year="2025-26",
                        version_no=1,
                        status="ACTIVE"
                    ))

        # Audit Log Entry
        if db.query(CurriculumAudit).count() == 0:
            db.add(CurriculumAudit(
                action="INITIAL_SEED",
                table_name="courses",
                record_id="ALL",
                performed_by="SYSTEM_SEEDER"
            ))

        db.commit()
        print("[Curriculum Seeder] Successfully seeded Curriculum OS database.")
    except Exception as e:
        print(f"[Curriculum Seeder] Error during seeding: {e}")
        db.rollback()
