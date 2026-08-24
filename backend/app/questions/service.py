"""
AI Question Intelligence Service Layer (Phase 5)
"""

import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from .models import Question, QuestionVersion, QuestionOption, QuestionSolution, QuestionPaper
from ..curriculum.models import Course, Batch
from ..syllabus.models import CourseTopic, CourseOutcome, CourseUnit
from .generator import generate_ai_questions_pipeline
from .schemas import QuestionGenerateSchema, QuestionOutSchema, QuestionReviewSchema, PaperBuildSchema, PaperOutSchema

class QuestionService:

    @staticmethod
    def generate_and_stage_questions(db: Session, data: QuestionGenerateSchema) -> List[Dict[str, Any]]:
        raw_questions = generate_ai_questions_pipeline(db, data)
        staged_list = []

        for q_data in raw_questions:
            q = Question(
                course_id=q_data["course_id"],
                topic_id=q_data["topic_id"],
                co_id=q_data["co_id"],
                unit_id=q_data["unit_id"],
                question_text=q_data["question_text"],
                question_type=q_data["question_type"],
                difficulty=q_data["difficulty"],
                bloom_level=q_data["bloom_level"],
                marks=q_data["marks"],
                language=q_data["language"],
                source_type=q_data["source_type"],
                ai_generated=True,
                status="PENDING_REVIEW",
                version=1,
                embedding_str=q_data["embedding_str"]
            )
            db.add(q)
            db.flush()

            # Add Options if MCQ
            for opt in q_data["options"]:
                db.add(QuestionOption(
                    question_id=q.id,
                    option_key=opt["key"],
                    option_text=opt["text"],
                    is_correct=opt["is_correct"]
                ))

            # Add Solution
            sol = q_data["solution"]
            db.add(QuestionSolution(
                question_id=q.id,
                solution_text=sol["solution_text"],
                stepwise_explanation=sol["stepwise_explanation"],
                references_text=sol["references_text"]
            ))

            # Initial Version
            db.add(QuestionVersion(
                question_id=q.id,
                version=1,
                question_text=q.question_text,
                change_summary="Original AI generated question"
            ))

            q_data["id"] = q.id
            staged_list.append(q_data)

        db.commit()
        return staged_list

    @staticmethod
    def review_question(db: Session, data: QuestionReviewSchema) -> Dict[str, Any]:
        q = db.query(Question).filter(Question.id == data.question_id).first()
        if not q:
            raise ValueError(f"Question ID '{data.question_id}' not found.")

        if data.action == "ACCEPT":
            q.status = "APPROVED"
        elif data.action == "REJECT":
            q.status = "REJECTED"
        elif data.action == "EDIT":
            if data.edited_text and data.edited_text != q.question_text:
                q.version += 1
                q.question_text = data.edited_text
                db.add(QuestionVersion(
                    question_id=q.id,
                    version=q.version,
                    question_text=data.edited_text,
                    modified_by=data.teacher_id,
                    change_summary="Teacher edited question text."
                ))
            if data.edited_marks:
                q.marks = data.edited_marks
            q.status = "APPROVED"

        db.commit()
        return {"id": q.id, "status": q.status, "version": q.version}

    @staticmethod
    def get_question_bank(
        db: Session,
        course_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        bloom_level: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[QuestionOutSchema]:
        
        query = db.query(Question)
        if course_id: query = query.filter(Question.course_id == course_id)
        if topic_id: query = query.filter(Question.topic_id == topic_id)
        if bloom_level: query = query.filter(Question.bloom_level == bloom_level)
        if status: query = query.filter(Question.status == status)

        questions = query.order_by(Question.created_at.desc()).limit(150).all()
        out = []

        for q in questions:
            out.append(QuestionOutSchema(
                id=q.id,
                course_id=q.course_id,
                course_code=q.course.course_code if q.course else "COURSE",
                topic_name=q.topic.topic_name if q.topic else "Core Topic",
                unit_number=q.unit.unit_number if q.unit else 1,
                co_code=q.outcome.co_code if q.outcome else "CO1",
                question_text=q.question_text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                bloom_level=q.bloom_level,
                marks=q.marks,
                language=q.language,
                source_type=q.source_type,
                ai_generated=q.ai_generated,
                status=q.status,
                version=q.version,
                quality_score=95.0,
                options=[{"id": o.id, "option_key": o.option_key, "option_text": o.option_text, "is_correct": o.is_correct} for o in q.options],
                solution={"solution_text": q.solution.solution_text, "stepwise_explanation": q.solution.stepwise_explanation, "references_text": q.solution.references_text} if q.solution else None
            ))
        return out

    @staticmethod
    def build_dynamic_question_paper(db: Session, data: PaperBuildSchema) -> PaperOutSchema:
        course = db.query(Course).filter(Course.id == data.course_id).first()
        if not course:
            raise ValueError(f"Course ID '{data.course_id}' not found.")

        batch = db.query(Batch).filter(Batch.batch_year == data.batch_year).first()
        b_id = batch.id if batch else None

        # Predefined University Templates
        templates_def = {
            "Midterm": {"total_marks": 30, "duration": 90, "sections": [
                {"title": "Section A: Multiple Choice (10 Marks)", "type": "MCQ", "count": 5, "marks": 2},
                {"title": "Section B: Short Answer Questions (20 Marks)", "type": "SHORT", "count": 4, "marks": 5}
            ]},
            "Sessional": {"total_marks": 50, "duration": 120, "sections": [
                {"title": "Section A: Multiple Choice (10 Marks)", "type": "MCQ", "count": 5, "marks": 2},
                {"title": "Section B: Short Answer Questions (20 Marks)", "type": "SHORT", "count": 4, "marks": 5},
                {"title": "Section C: Long Essay Questions (20 Marks)", "type": "LONG", "count": 2, "marks": 10}
            ]},
            "EndSem": {"total_marks": 100, "duration": 180, "sections": [
                {"title": "Section A: Multiple Choice (20 Marks)", "type": "MCQ", "count": 10, "marks": 2},
                {"title": "Section B: Short Answer Questions (30 Marks)", "type": "SHORT", "count": 6, "marks": 5},
                {"title": "Section C: Long Essay Questions (50 Marks)", "type": "LONG", "count": 5, "marks": 10}
            ]},
            "Quiz": {"total_marks": 20, "duration": 30, "sections": [
                {"title": "Section A: Quick MCQs (20 Marks)", "type": "MCQ", "count": 10, "marks": 2}
            ]}
        }

        tmpl = templates_def.get(data.template_type, templates_def["EndSem"])
        total_marks = tmpl["total_marks"]
        duration = tmpl["duration"]

        paper_sections = []
        bloom_counts = {"Remember": 0, "Understand": 0, "Apply": 0, "Analyze": 0, "Evaluate": 0}
        co_counts = {"CO1": 0, "CO2": 0, "CO3": 0, "CO4": 0}

        for sec in tmpl["sections"]:
            q_type = sec["type"]
            count = sec["count"]

            # Query questions from bank or generate on-the-fly
            bank_qs = db.query(Question).filter(
                Question.course_id == course.id,
                Question.question_type == q_type,
                Question.status == "APPROVED"
            ).limit(count).all()

            sec_questions = []
            for b_q in bank_qs:
                bloom_counts[b_q.bloom_level] = bloom_counts.get(b_q.bloom_level, 0) + 1
                co_code = b_q.outcome.co_code if b_q.outcome else "CO1"
                co_counts[co_code] = co_counts.get(co_code, 0) + 1

                sec_questions.append({
                    "id": b_q.id,
                    "question_text": b_q.question_text,
                    "question_type": b_q.question_type,
                    "marks": b_q.marks,
                    "bloom_level": b_q.bloom_level,
                    "co_code": co_code,
                    "options": [{"key": o.option_key, "text": o.option_text} for o in b_q.options]
                })

            # If bank has fewer questions, generate remaining
            rem = count - len(sec_questions)
            if rem > 0:
                gen_data = QuestionGenerateSchema(
                    course_id=course.id,
                    question_type=q_type,
                    count=rem,
                    marks=sec["marks"]
                )
                raw_gen = generate_ai_questions_pipeline(db, gen_data)
                for g in raw_gen:
                    bloom_counts[g["bloom_level"]] = bloom_counts.get(g["bloom_level"], 0) + 1
                    co_counts[g["co_code"]] = co_counts.get(g["co_code"], 0) + 1

                    sec_questions.append({
                        "id": g["course_id"],
                        "question_text": g["question_text"],
                        "question_type": g["question_type"],
                        "marks": g["marks"],
                        "bloom_level": g["bloom_level"],
                        "co_code": g["co_code"],
                        "options": g["options"]
                    })

            paper_sections.append({
                "section_title": sec["title"],
                "questions": sec_questions
            })

        paper = QuestionPaper(
            title=data.title,
            course_id=course.id,
            batch_id=b_id,
            semester=data.semester,
            total_marks=total_marks,
            duration_minutes=duration,
            template_type=data.template_type,
            paper_structure=paper_sections,
            created_by=data.faculty_id
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)

        return PaperOutSchema(
            id=paper.id,
            title=paper.title,
            course_code=course.course_code,
            course_name=course.course_name,
            batch_year=data.batch_year,
            semester=data.semester,
            total_marks=total_marks,
            duration_minutes=duration,
            template_type=data.template_type,
            sections=paper_sections,
            bloom_distribution=bloom_counts,
            co_distribution=co_counts,
            created_at=paper.created_at.strftime("%Y-%m-%d %H:%M") if paper.created_at else "Now"
        )
