"""
FastAPI Router for Syllabus Intelligence Engine (Phase 2)
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from .service import SyllabusService
from .schemas import SyllabusCourseDetailResponse, VersionDiffSchema

router = APIRouter(
    prefix="/api/syllabus",
    tags=["Syllabus Intelligence Engine"]
)

@router.post("/upload")
async def upload_syllabus_file(
    file: UploadFile = File(...),
    course_id: Optional[str] = Form(None),
    source_type: str = Form("OFFICIAL"),
    db: Session = Depends(get_db)
):
    """
    Upload and parse official or additional course syllabus (PDF, DOCX, PPTX, Image).
    Multi-stage parsing extracts Units, Topics, COs, and Books into Knowledge Graph.
    """
    allowed_extensions = (".pdf", ".docx", ".doc", ".pptx", ".ppt", ".png", ".jpg", ".jpeg")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file.filename}'. Allowed formats: PDF, DOCX, PPTX, PNG, JPG."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        res = SyllabusService.process_syllabus_upload(
            db=db,
            file_bytes=file_bytes,
            filename=file.filename,
            course_id=course_id,
            source_type=source_type
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process syllabus file: {str(e)}")

@router.get("/status/{file_id}")
def get_syllabus_status(file_id: str, db: Session = Depends(get_db)):
    """Fetch parser progress and confidence score for an uploaded file."""
    from .models import SyllabusFile
    s_file = db.query(SyllabusFile).filter(SyllabusFile.id == file_id).first()
    if not s_file:
        raise HTTPException(status_code=404, detail="Syllabus file record not found.")

    return {
        "file_id": s_file.id,
        "file_name": s_file.file_name,
        "source_type": s_file.source_type,
        "status": s_file.upload_status,
        "confidence": float(s_file.parser_confidence),
        "total_units": len(s_file.units),
        "total_outcomes": len(s_file.outcomes),
        "total_books": len(s_file.books),
        "created_at": s_file.created_at.strftime("%Y-%m-%d %H:%M")
    }

@router.get("/course/{course_id}", response_model=SyllabusCourseDetailResponse)
def get_syllabus_course_details(course_id: str, db: Session = Depends(get_db)):
    """Fetch complete extracted Knowledge Graph structure, units, topics, outcomes, and books for a course."""
    try:
        return SyllabusService.get_course_syllabus_details(db, course_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/compare/{old_file_id}/{new_file_id}", response_model=VersionDiffSchema)
def compare_syllabus_versions(old_file_id: str, new_file_id: str, db: Session = Depends(get_db)):
    """Compare two syllabus versions and generate added/removed/changed topic diff analysis."""
    try:
        return SyllabusService.compare_syllabus_versions(db, old_file_id, new_file_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
