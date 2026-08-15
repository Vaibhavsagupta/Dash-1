from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

from .. import models
from . import risk_explanation_engine

def process_question_response(
    student_id: str,
    question_id: str,
    subject_id: str,
    concept_ids: List[str],
    is_correct: bool,
    time_taken_seconds: float,
    difficulty: str,
    db: Session
) -> Dict[str, Any]:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return {"error": "Student not found"}

    # 1. Update Question Analytics
    q_analytics = db.query(models.QuestionAnalytics).filter(
        models.QuestionAnalytics.question_id == question_id
    ).first()

    if not q_analytics:
        q_analytics = models.QuestionAnalytics(
            question_id=question_id,
            expected_difficulty=difficulty,
            attempt_count=0,
            correct_count=0,
            incorrect_count=0,
            average_time_seconds=0.0
        )
        db.add(q_analytics)

    q_analytics.attempt_count = (q_analytics.attempt_count or 0) + 1
    if is_correct:
        q_analytics.correct_count = (q_analytics.correct_count or 0) + 1
    else:
        q_analytics.incorrect_count = (q_analytics.incorrect_count or 0) + 1

    q_analytics.accuracy = round((q_analytics.correct_count / q_analytics.attempt_count) * 100.0, 1)
    q_analytics.average_time_seconds = round(
        ((q_analytics.average_time_seconds * (q_analytics.attempt_count - 1)) + time_taken_seconds) / q_analytics.attempt_count, 1
    )

    # Flag Question for Review if accuracy < 20% after 5+ attempts
    if q_analytics.attempt_count >= 5 and q_analytics.accuracy < 20.0:
        q_analytics.status = "QUESTION_REVIEW_REQUIRED"

    db.commit()

    # 2. Update Student Concept Mastery for mapped concepts
    updated_concepts = []
    for cid in concept_ids:
        c_mastery = db.query(models.StudentConceptMastery).filter(
            models.StudentConceptMastery.student_id == student.enrollment_no,
            models.StudentConceptMastery.concept_id == cid
        ).first()

        if not c_mastery:
            c_mastery = models.StudentConceptMastery(
                student_id=student.enrollment_no,
                subject_id=subject_id,
                concept_id=cid,
                attempts=0,
                correct=0,
                incorrect=0,
                accuracy=0.0,
                mastery_score=0.0
            )
            db.add(c_mastery)

        prev_mastery = c_mastery.mastery_score or 0.0
        c_mastery.attempts = (c_mastery.attempts or 0) + 1
        if is_correct:
            c_mastery.correct = (c_mastery.correct or 0) + 1
        else:
            c_mastery.incorrect = (c_mastery.incorrect or 0) + 1

        c_mastery.accuracy = round((c_mastery.correct / c_mastery.attempts) * 100.0, 1)

        # Update difficulty-level accuracy
        diff_upper = str(difficulty).upper()
        if diff_upper == "EASY":
            c_mastery.easy_accuracy = c_mastery.accuracy
        elif diff_upper == "HARD":
            c_mastery.hard_accuracy = c_mastery.accuracy
        else:
            c_mastery.medium_accuracy = c_mastery.accuracy

        # Calculate Mastery Score (0-100) & Mastery Level
        if c_mastery.attempts < 3:
            c_mastery.mastery_level = "INSUFFICIENT_DATA"
            c_mastery.mastery_score = c_mastery.accuracy
        else:
            c_mastery.mastery_score = c_mastery.accuracy
            score = c_mastery.mastery_score
            if score >= 90.0:
                c_mastery.mastery_level = "MASTERED"
            elif score >= 75.0:
                c_mastery.mastery_level = "PROFICIENT"
            elif score >= 60.0:
                c_mastery.mastery_level = "DEVELOPING"
            elif score >= 40.0:
                c_mastery.mastery_level = "WEAK"
            else:
                c_mastery.mastery_level = "CRITICAL"

            # Check for significant decline and notify Part 3
            if prev_mastery > 0 and (prev_mastery - score) >= 15.0:
                risk_explanation_engine.evaluate_and_explain_risk(student.enrollment_no, db)

        db.commit()
        db.refresh(c_mastery)
        updated_concepts.append(c_mastery)

    return {
        "status": "success",
        "question_id": question_id,
        "updated_concepts_count": len(updated_concepts)
    }

def get_student_subject_concepts(student_id: str, subject_id: str, db: Session) -> List[Dict[str, Any]]:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return []

    concepts = db.query(models.Concept).filter(models.Concept.subject_id == subject_id).all()
    results = []

    for c in concepts:
        mastery = db.query(models.StudentConceptMastery).filter(
            models.StudentConceptMastery.student_id == student.enrollment_no,
            models.StudentConceptMastery.concept_id == c.id
        ).first()

        results.append({
            "concept_id": c.id,
            "concept_name": c.concept_name,
            "chapter": c.chapter,
            "topic": c.topic,
            "attempts": mastery.attempts if mastery else 0,
            "correct": mastery.correct if mastery else 0,
            "incorrect": mastery.incorrect if mastery else 0,
            "accuracy": mastery.accuracy if mastery else 0.0,
            "easy_accuracy": mastery.easy_accuracy if mastery else 0.0,
            "medium_accuracy": mastery.medium_accuracy if mastery else 0.0,
            "hard_accuracy": mastery.hard_accuracy if mastery else 0.0,
            "mastery_score": mastery.mastery_score if mastery else 0.0,
            "mastery_level": mastery.mastery_level if mastery else "INSUFFICIENT_DATA",
            "trend": mastery.trend if mastery else "STABLE"
        })

    return results
