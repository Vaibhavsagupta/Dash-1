"""
Curriculum OS Service Layer & Validation Rules Engine
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import Program, SemesterTemplate, CourseSlot, Course, CurriculumVersion
from .schemas import (
    ProgramOut, SemesterCurriculumOut, CourseOut,
    ValidationRuleResult, CurriculumOverviewItem
)
from .constants import SEMESTER_MARKS, BASE_SLOTS

class CurriculumService:

    @staticmethod
    def get_programs(db: Session):
        programs = db.query(Program).filter(Program.is_active == True).order_by(Program.id).all()
        return [p.code for p in programs]

    @staticmethod
    def get_semesters(db: Session):
        semesters = db.query(SemesterTemplate.semester).order_by(SemesterTemplate.semester).all()
        return [s[0] for s in semesters]

    @staticmethod
    def validate_curriculum(db: Session, program_code: str, semester: int):
        issues = []
        program = db.query(Program).filter(Program.code == program_code.upper()).first()
        if not program:
            issues.append(ValidationRuleResult(
                rule_name="Wrong Program",
                status="FAIL",
                message=f"Program code '{program_code}' does not exist in the database."
            ))
            return False, issues, 0, 0

        sem_template = db.query(SemesterTemplate).filter(SemesterTemplate.semester == semester).first()
        expected_marks = sem_template.total_marks if sem_template else SEMESTER_MARKS.get(semester, 0)
        if not sem_template:
            issues.append(ValidationRuleResult(
                rule_name="Wrong Semester",
                status="FAIL",
                message=f"Semester '{semester}' is invalid or missing in semester templates."
            ))

        courses = db.query(Course).filter(
            Course.program_id == program.id,
            Course.semester == semester
        ).all()

        # Rule 1: Duplicate Course Code Check
        seen_codes = set()
        duplicates = set()
        for c in courses:
            if c.course_code in seen_codes:
                duplicates.add(c.course_code)
            seen_codes.add(c.course_code)
        
        if duplicates:
            issues.append(ValidationRuleResult(
                rule_name="Duplicate Course Code",
                status="FAIL",
                message=f"Duplicate course codes detected: {', '.join(duplicates)}"
            ))
        else:
            issues.append(ValidationRuleResult(
                rule_name="Duplicate Course Code",
                status="PASS",
                message="No duplicate course codes found."
            ))

        # Rule 2: Wrong Semester Check
        wrong_sem = [c.course_code for c in courses if c.semester != semester]
        if wrong_sem:
            issues.append(ValidationRuleResult(
                rule_name="Wrong Semester Mapping",
                status="FAIL",
                message=f"Courses associated with wrong semester: {', '.join(wrong_sem)}"
            ))
        else:
            issues.append(ValidationRuleResult(
                rule_name="Wrong Semester Mapping",
                status="PASS",
                message="All courses correctly mapped to target semester."
            ))

        # Rule 3: Total Marks Mismatch Check
        calculated_marks = sum(c.theory_marks + c.practical_marks for c in courses)
        if calculated_marks != expected_marks:
            issues.append(ValidationRuleResult(
                rule_name="Marks Mismatch",
                status="FAIL",
                message=f"Total marks mismatch: Expected {expected_marks}, found {calculated_marks}."
            ))
        else:
            issues.append(ValidationRuleResult(
                rule_name="Marks Mismatch",
                status="PASS",
                message=f"Total marks match expected target ({expected_marks} marks)."
            ))

        # Rule 4: Missing DSE Slot Warning
        expected_slots = BASE_SLOTS.get(semester, [])
        expected_dse = [s["slot_code"] for s in expected_slots if s["is_specialization"]]
        mapped_slot_ids = {c.slot_id for c in courses if c.slot_id}
        mapped_slots = db.query(CourseSlot.slot_code).filter(CourseSlot.id.in_(mapped_slot_ids)).all() if mapped_slot_ids else []
        mapped_slot_codes = {s[0] for s in mapped_slots}
        
        missing_dse = [dse for dse in expected_dse if dse not in mapped_slot_codes]
        if missing_dse:
            issues.append(ValidationRuleResult(
                rule_name="Missing DSE Slot",
                status="WARNING",
                message=f"Missing specialization DSE slots for semester {semester}: {', '.join(missing_dse)}"
            ))
        else:
            issues.append(ValidationRuleResult(
                rule_name="Missing DSE Slot",
                status="PASS",
                message="All required DSE specialization slots are mapped."
            ))

        is_valid = not any(issue.status == "FAIL" for issue in issues)
        return is_valid, issues, expected_marks, calculated_marks

    @staticmethod
    def get_curriculum_for_program_sem(db: Session, program_code: str, semester: int) -> SemesterCurriculumOut:
        program = db.query(Program).filter(Program.code == program_code.upper()).first()
        if not program:
            raise ValueError(f"Program '{program_code}' not found")

        is_valid, issues, expected_marks, calculated_marks = CurriculumService.validate_curriculum(db, program_code, semester)

        courses_query = db.query(Course).filter(
            Course.program_id == program.id,
            Course.semester == semester
        ).all()

        subject_list = []
        for c in courses_query:
            slot_code = c.slot.slot_code if c.slot else None
            tot_m = c.theory_marks + c.practical_marks
            subject_list.append(CourseOut(
                id=c.id,
                program_id=c.program_id,
                program_code=program.code,
                semester=c.semester,
                slot_id=c.slot_id,
                slot_code=slot_code,
                course_code=c.course_code,
                course_name=c.course_name,
                theory_marks=c.theory_marks,
                practical_marks=c.practical_marks,
                internal_marks=c.internal_marks,
                external_marks=c.external_marks,
                total_marks=tot_m
            ))

        return SemesterCurriculumOut(
            program=program.code,
            semester=semester,
            expected_total_marks=expected_marks,
            calculated_total_marks=calculated_marks,
            subject_count=len(subject_list),
            is_valid=is_valid,
            validation_issues=issues,
            subjects=subject_list
        )

    @staticmethod
    def get_curriculum_overview(db: Session):
        programs = db.query(Program).filter(Program.is_active == True).order_by(Program.id).all()
        result = []

        for p in programs:
            sem_summaries = []
            total_prog_marks = 0
            for sem in range(1, 9):
                is_valid, issues, expected_m, calc_m = CurriculumService.validate_curriculum(db, p.code, sem)
                cnt = db.query(Course).filter(Course.program_id == p.id, Course.semester == sem).count()
                total_prog_marks += calc_m
                sem_summaries.append({
                    "semester": sem,
                    "expected_marks": expected_m,
                    "calculated_marks": calc_m,
                    "subject_count": cnt,
                    "is_valid": is_valid,
                    "warnings": len([i for i in issues if i.status == "WARNING"]),
                    "failures": len([i for i in issues if i.status == "FAIL"])
                })

            result.append(CurriculumOverviewItem(
                program_code=p.code,
                program_name=p.name,
                total_semesters=8,
                total_curriculum_marks=total_prog_marks,
                semester_summaries=sem_summaries
            ))

        return result
