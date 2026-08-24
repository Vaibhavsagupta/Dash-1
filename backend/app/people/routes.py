"""
FastAPI Router for Student & Faculty Management System (Phase 3)
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from .service import PeopleService
from .importer import process_excel_student_import
from .schemas import (
    StudentOutSchema, StudentProfileResponse, FacultyOutSchema,
    FacultyCreateSchema, FacultyCourseAssignSchema, FacultyCourseMappingOut,
    ImportSummaryResponse
)

router = APIRouter(
    prefix="/api",
    tags=["Student & Faculty Management System"]
)

@router.post("/students/import", response_model=ImportSummaryResponse)
async def import_students_from_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk import students from Excel (.xlsx) or CSV file.
    Auto-detects columns, derives Batch/Program/Semester, and filters duplicate enrollments.
    """
    allowed_exts = (".xlsx", ".xls", ".csv")
    if not file.filename.lower().endswith(allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{file.filename}'. Allowed formats: XLSX, CSV."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = process_excel_student_import(db, file_bytes, file.filename)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process import: {str(e)}")

@router.get("/students/search", response_model=List[StudentOutSchema])
def search_students(
    q: Optional[str] = Query(None, description="Search query for name, enrollment, scholar no, email"),
    program_code: Optional[str] = Query(None, description="Program filter (AI, CSF, FSD)"),
    batch_year: Optional[int] = Query(None, description="Batch year filter (2020-2023)"),
    semester: Optional[int] = Query(None, description="Semester filter (1-8)"),
    db: Session = Depends(get_db)
):
    """Search & filter student records across programs, batches, and semesters."""
    return PeopleService.search_students(db, q, program_code, batch_year, semester)

@router.get("/students/{student_id}", response_model=StudentProfileResponse)
def get_student_profile(student_id: str, db: Session = Depends(get_db)):
    """Fetch complete student profile including personal details, parent contact, and academic history."""
    try:
        return PeopleService.get_student_profile(db, student_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/faculty", response_model=List[FacultyOutSchema])
def get_all_faculty(db: Session = Depends(get_db)):
    """Fetch list of all active faculty members."""
    return PeopleService.get_all_faculty(db)

@router.post("/faculty", response_model=FacultyOutSchema, status_code=status.HTTP_201_CREATED)
def create_faculty(data: FacultyCreateSchema, db: Session = Depends(get_db)):
    """Add a new faculty member profile and auto-create teacher user account."""
    try:
        return PeopleService.create_faculty(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.post("/faculty/assign-course", response_model=FacultyCourseMappingOut)
def assign_faculty_to_course(data: FacultyCourseAssignSchema, db: Session = Depends(get_db)):
    """Assign a faculty member to teach a course for a specific batch and semester."""
    try:
        return PeopleService.assign_faculty_to_course(
            db,
            faculty_id=data.faculty_id,
            course_id=data.course_id,
            batch_year=data.batch_year,
            semester=data.semester,
            session_name=data.session_name or "2025-26"
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/faculty/{faculty_id}/courses", response_model=List[FacultyCourseMappingOut])
def get_faculty_assigned_courses(faculty_id: str, db: Session = Depends(get_db)):
    """Fetch list of assigned courses and batches for a faculty member."""
    try:
        return PeopleService.get_faculty_assigned_courses(db, faculty_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
