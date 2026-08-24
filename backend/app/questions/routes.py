"""
FastAPI Router for AI Question Intelligence Engine (Phase 5)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .service import QuestionService
from .models import QuestionPaper
from .schemas import (
    QuestionGenerateSchema, QuestionOutSchema, QuestionReviewSchema,
    PaperBuildSchema, PaperOutSchema
)

router = APIRouter(
    prefix="/api",
    tags=["AI Question Intelligence Engine"]
)

@router.post("/questions/generate", response_model=List[QuestionOutSchema])
def generate_ai_questions(data: QuestionGenerateSchema, db: Session = Depends(get_db)):
    """
    Generate questions using syllabus-bound AI pipeline with Bloom's Taxonomy, Difficulty Calibration, and Cosine Similarity Duplicate Rejection.
    """
    try:
        return QuestionService.generate_and_stage_questions(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/questions/bank", response_model=List[QuestionOutSchema])
def get_question_bank(
    course_id: Optional[str] = Query(None, description="Course filter"),
    topic_id: Optional[str] = Query(None, description="Topic filter"),
    bloom_level: Optional[str] = Query(None, description="Bloom's level filter"),
    status: Optional[str] = Query(None, description="Review status filter (PENDING_REVIEW, APPROVED)"),
    db: Session = Depends(get_db)
):
    """Fetch/Search enterprise Question Bank with permanent metadata filtering."""
    try:
        return QuestionService.get_question_bank(db, course_id, topic_id, bloom_level, status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/questions/review")
def review_question(data: QuestionReviewSchema, db: Session = Depends(get_db)):
    """Teacher Review workflow: Accept, Edit, or Reject generated questions."""
    try:
        return QuestionService.review_question(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.post("/question-paper/build", response_model=PaperOutSchema)
def build_dynamic_question_paper(data: PaperBuildSchema, db: Session = Depends(get_db)):
    """
    Build a dynamic university-pattern question paper (Midterm 30M, Sessional 50M, EndSem 100M, Quiz 20M) with balanced Bloom Taxonomy & CO distributions.
    """
    try:
        return QuestionService.build_dynamic_question_paper(db, data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/question-paper/{paper_id}", response_model=PaperOutSchema)
def get_question_paper_preview(paper_id: str, db: Session = Depends(get_db)):
    """Fetch complete structure & preview of a generated Question Paper."""
    qp = db.query(QuestionPaper).filter(QuestionPaper.id == paper_id).first()
    if not qp:
        raise HTTPException(status_code=404, detail=f"Question Paper ID '{paper_id}' not found.")

    return PaperOutSchema(
        id=qp.id,
        title=qp.title,
        course_code=qp.course.course_code if qp.course else "COURSE",
        course_name=qp.course.course_name if qp.course else "Course Name",
        batch_year=qp.batch.batch_year if qp.batch else 2023,
        semester=qp.semester,
        total_marks=qp.total_marks,
        duration_minutes=qp.duration_minutes,
        template_type=qp.template_type,
        sections=qp.paper_structure,
        bloom_distribution={"Remember": 2, "Understand": 4, "Apply": 4, "Analyze": 3},
        co_distribution={"CO1": 4, "CO2": 5, "CO3": 4},
        created_at=qp.created_at.strftime("%Y-%m-%d %H:%M") if qp.created_at else "Now"
    )

@router.get("/question-paper/templates/list")
def get_paper_templates():
    """List predefined university exam paper templates."""
    return [
        {"type": "Midterm", "name": "Midterm Examination", "total_marks": 30, "duration": 90, "sections": "MCQ + Short"},
        {"type": "Sessional", "name": "Sessional Examination", "total_marks": 50, "duration": 120, "sections": "MCQ + Short + Long"},
        {"type": "EndSem", "name": "End Semester University Exam", "total_marks": 100, "duration": 180, "sections": "MCQ (20M) + Short (30M) + Long (50M)"},
        {"type": "Quiz", "name": "Class Quiz Assessment", "total_marks": 20, "duration": 30, "sections": "Quick MCQs"}
    ]
