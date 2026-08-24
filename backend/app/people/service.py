"""
Student & Faculty Service Layer (Phase 3)
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .models import Student, Faculty, FacultyCourseMapping, StudentAcademicMapping, UserAccount
from ..curriculum.models import Course, Program, Batch, AcademicSession
from .schemas import (
    StudentOutSchema, StudentProfileResponse, FacultyOutSchema,
    FacultyCourseMappingOut, StudentAcademicHistorySchema, FacultyCreateSchema
)
from ..auth import get_password_hash

class PeopleService:

    @staticmethod
    def search_students(
        db: Session,
        query: Optional[str] = None,
        program_code: Optional[str] = None,
        batch_year: Optional[int] = None,
        semester: Optional[int] = None
    ) -> List[StudentOutSchema]:
        
        q = db.query(Student).filter(Student.status == "ACTIVE")

        if query:
            pattern = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Student.full_name.ilike(pattern),
                    Student.enrollment_no.ilike(pattern),
                    Student.scholar_no.ilike(pattern),
                    Student.email.ilike(pattern)
                )
            )

        if program_code:
            prog = db.query(Program).filter(Program.code == program_code.upper()).first()
            if prog:
                q = q.filter(Student.program_id == prog.id)

        if batch_year:
            batch = db.query(Batch).filter(Batch.batch_year == batch_year).first()
            if batch:
                q = q.filter(Student.batch_id == batch.id)

        if semester:
            q = q.filter(Student.current_semester == semester)

        students = q.order_by(Student.created_at.desc()).limit(200).all()

        out = []
        for s in students:
            p_code = s.program_rel.code if s.program_rel else "AI"
            b_year = s.batch.batch_year if s.batch else (s.admission_year or 2023)
            out.append(StudentOutSchema(
                id=s.id,
                enrollment_no=s.enrollment_no,
                scholar_no=s.scholar_no,
                full_name=s.full_name,
                gender=s.gender,
                email=s.email,
                mobile=s.mobile,
                parent_name=s.parent_name,
                parent_mobile=s.parent_mobile,
                program_code=p_code,
                batch_year=b_year,
                current_semester=s.current_semester,
                status=s.status
            ))
        return out

    @staticmethod
    def get_student_profile(db: Session, student_id: str) -> StudentProfileResponse:
        s = db.query(Student).filter(Student.id == student_id).first()
        if not s:
            raise ValueError(f"Student ID '{student_id}' not found.")

        p_code = s.program_rel.code if s.program_rel else "AI"
        b_year = s.batch.batch_year if s.batch else (s.admission_year or 2023)

        st_out = StudentOutSchema(
            id=s.id,
            enrollment_no=s.enrollment_no,
            scholar_no=s.scholar_no,
            full_name=s.full_name,
            gender=s.gender,
            email=s.email,
            mobile=s.mobile,
            parent_name=s.parent_name,
            parent_mobile=s.parent_mobile,
            program_code=p_code,
            batch_year=b_year,
            current_semester=s.current_semester,
            status=s.status
        )

        history_out = []
        for h in s.academic_history:
            history_out.append(StudentAcademicHistorySchema(
                session_name=h.academic_session.session_name if h.academic_session else "2025-26",
                semester=h.semester,
                program_code=h.program.code if h.program else p_code,
                batch_year=h.batch.batch_year if h.batch else b_year,
                promoted=h.promoted
            ))

        # Enrolled courses for student's current program and semester
        enrolled_courses = []
        if s.program_id and s.current_semester:
            courses = db.query(Course).filter(
                Course.program_id == s.program_id,
                Course.semester == s.current_semester
            ).all()
            for c in courses:
                enrolled_courses.append({
                    "course_id": c.id,
                    "course_code": c.course_code,
                    "course_name": c.course_name,
                    "total_marks": c.theory_marks + c.practical_marks
                })

        return StudentProfileResponse(
            student=st_out,
            parent_name=s.parent_name,
            parent_mobile=s.parent_mobile,
            address=s.address,
            blood_group=s.blood_group,
            academic_history=history_out,
            enrolled_courses=enrolled_courses,
            assigned_faculty=[]
        )

    @staticmethod
    def get_all_faculty(db: Session) -> List[FacultyOutSchema]:
        faculty_list = db.query(Faculty).filter(Faculty.status == "ACTIVE").order_by(Faculty.full_name).all()
        return [
            FacultyOutSchema(
                id=f.id,
                employee_code=f.employee_code,
                full_name=f.full_name,
                email=f.email,
                mobile=f.mobile,
                designation=f.designation,
                department=f.department,
                status=f.status
            )
            for f in faculty_list
        ]

    @staticmethod
    def create_faculty(db: Session, data: FacultyCreateSchema) -> FacultyOutSchema:
        existing = db.query(Faculty).filter(
            or_(Faculty.employee_code == data.employee_code, Faculty.email == data.email)
        ).first()
        if existing:
            raise ValueError(f"Faculty with employee code '{data.employee_code}' or email '{data.email}' already exists.")

        f = Faculty(
            employee_code=data.employee_code,
            full_name=data.full_name,
            email=data.email,
            mobile=data.mobile,
            designation=data.designation or "Assistant Professor",
            department=data.department or "CSE",
            status="ACTIVE"
        )
        db.add(f)
        db.flush()

        # Add User Account for Faculty
        if not db.query(UserAccount).filter(UserAccount.email == data.email).first():
            db.add(UserAccount(
                email=data.email,
                password_hash=get_password_hash("teacher123"),
                role="teacher",
                linked_faculty=f.id,
                is_active=True
            ))

        db.commit()

        return FacultyOutSchema(
            id=f.id,
            employee_code=f.employee_code,
            full_name=f.full_name,
            email=f.email,
            mobile=f.mobile,
            designation=f.designation,
            department=f.department,
            status=f.status
        )

    @staticmethod
    def assign_faculty_to_course(
        db: Session,
        faculty_id: str,
        course_id: str,
        batch_year: int,
        semester: int,
        session_name: str = "2025-26"
    ) -> FacultyCourseMappingOut:
        
        fac = db.query(Faculty).filter(Faculty.id == faculty_id).first()
        if not fac:
            raise ValueError(f"Faculty ID '{faculty_id}' not found.")

        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError(f"Course ID '{course_id}' not found.")

        batch = db.query(Batch).filter(Batch.batch_year == batch_year).first()
        b_id = batch.id if batch else None

        sess = db.query(AcademicSession).filter(AcademicSession.session_name == session_name).first()
        s_id = sess.id if sess else None

        # Check existing mapping
        existing = db.query(FacultyCourseMapping).filter(
            FacultyCourseMapping.faculty_id == faculty_id,
            FacultyCourseMapping.course_id == course_id,
            FacultyCourseMapping.semester == semester
        ).first()

        if not existing:
            mapping = FacultyCourseMapping(
                faculty_id=faculty_id,
                course_id=course_id,
                batch_id=b_id,
                semester=semester,
                academic_session_id=s_id
            )
            db.add(mapping)
            db.commit()
            db.refresh(mapping)
        else:
            mapping = existing

        return FacultyCourseMappingOut(
            id=mapping.id,
            faculty_id=fac.id,
            faculty_name=fac.full_name,
            course_id=course.id,
            course_code=course.course_code,
            course_name=course.course_name,
            batch_year=batch_year,
            semester=semester,
            session_name=session_name
        )

    @staticmethod
    def get_faculty_assigned_courses(db: Session, faculty_id: str) -> List[FacultyCourseMappingOut]:
        fac = db.query(Faculty).filter(Faculty.id == faculty_id).first()
        if not fac:
            raise ValueError(f"Faculty ID '{faculty_id}' not found.")

        mappings = db.query(FacultyCourseMapping).filter(FacultyCourseMapping.faculty_id == faculty_id).all()

        out = []
        for m in mappings:
            out.append(FacultyCourseMappingOut(
                id=m.id,
                faculty_id=fac.id,
                faculty_name=fac.full_name,
                course_id=m.course.id,
                course_code=m.course.course_code,
                course_name=m.course.course_name,
                batch_year=m.batch.batch_year if m.batch else 2023,
                semester=m.semester,
                session_name=m.academic_session.session_name if m.academic_session else "2025-26"
            ))
        return out
