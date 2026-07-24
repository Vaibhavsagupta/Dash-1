from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import json
import random

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user_obj as get_current_user

router = APIRouter(
    prefix="/student/tests",
    tags=["student_tests"],
)

@router.get("")
def list_student_tests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view assigned tests")
        
    student_id = current_user.linked_id
    assignments = db.query(models.TestAssignment).filter(
        models.TestAssignment.student_id == student_id
    ).all()
    
    pending = []
    in_progress = []
    completed = []
    expired = []
    
    new_test_count = 0
    today = date.today()
    
    for assign in assignments:
        test = db.query(models.Test).filter(models.Test.id == assign.test_id).first()
        if not test:
            continue
            
        test_info = {
            "assignment_id": assign.id,
            "test_id": test.id,
            "name": test.name,
            "subject": test.subject,
            "topic": test.topic,
            "description": test.description,
            "duration": test.duration,
            "passing_marks": test.passing_marks,
            "difficulty": test.difficulty,
            "start_date": assign.start_date.isoformat(),
            "end_date": assign.end_date.isoformat(),
            "randomize_questions": assign.randomize_questions,
            "randomize_options": assign.randomize_options,
            "allow_retake": assign.allow_retake,
            "show_result_immediately": assign.show_result_immediately,
            "show_correct_answers": assign.show_correct_answers,
            "status": assign.status,
            "created_at": assign.created_at.isoformat() if assign.created_at else None
        }
        
        # Check expiry
        if assign.end_date < today and assign.status != "Completed":
            assign.status = "Expired"
            db.commit()
            test_info["status"] = "Expired"
            expired.append(test_info)
        elif assign.status == "Completed":
            completed.append(test_info)
        elif assign.status == "In Progress":
            in_progress.append(test_info)
        else:  # Pending
            pending.append(test_info)
            new_test_count += 1
            
    return {
        "new_test_count": new_test_count,
        "tests": {
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed,
            "expired": expired
        }
    }

@router.get("/{id}")
def get_student_test_info(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view test info")
        
    student_id = current_user.linked_id
    assign = db.query(models.TestAssignment).filter(
        models.TestAssignment.id == id,
        models.TestAssignment.student_id == student_id
    ).first()
    
    if not assign:
        raise HTTPException(status_code=404, detail="Test assignment not found")
        
    test = db.query(models.Test).filter(models.Test.id == assign.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test details not found")
        
    # Check if expired
    if assign.end_date < date.today() and assign.status != "Completed":
        assign.status = "Expired"
        db.commit()
        
    return {
        "assignment_id": assign.id,
        "test_id": test.id,
        "name": test.name,
        "subject": test.subject,
        "topic": test.topic,
        "description": test.description,
        "duration": test.duration,
        "passing_marks": test.passing_marks,
        "difficulty": test.difficulty,
        "status": assign.status,
        "start_date": assign.start_date.isoformat(),
        "end_date": assign.end_date.isoformat()
    }

@router.post("/{id}/start")
def start_student_test(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can start a test")
        
    student_id = current_user.linked_id
    assign = db.query(models.TestAssignment).filter(
        models.TestAssignment.id == id,
        models.TestAssignment.student_id == student_id
    ).first()
    
    if not assign:
        raise HTTPException(status_code=404, detail="Test assignment not found")
        
    if assign.status == "Completed" and not assign.allow_retake:
        raise HTTPException(status_code=400, detail="Retake is not permitted for this test")
        
    if assign.end_date < date.today():
        raise HTTPException(status_code=400, detail="This test has expired")
        
    # Change status to In Progress
    assign.status = "In Progress"
    
    # Create attempt
    attempt = models.TestAttempt(
        test_assignment_id=assign.id,
        student_id=student_id,
        started_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Fetch questions
    questions = db.query(models.Question).filter(models.Question.test_id == assign.test_id).all()
    
    # Shuffle if configured
    if assign.randomize_questions:
        random.shuffle(questions)
        
    formatted_questions = []
    for q in questions:
        # Parse options
        opts = []
        if q.options:
            try:
                opts = json.loads(q.options)
                if assign.randomize_options and isinstance(opts, list):
                    random.shuffle(opts)
            except Exception:
                opts = []
                
        # Strip correct answer & explanation to avoid leaking them
        formatted_questions.append({
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": opts,
            "difficulty": q.difficulty,
            "subject": q.subject,
            "topic": q.topic,
            "subtopic": q.subtopic
        })
        
    # Log started activity
    log = models.TestActivityLog(
        attempt_id=attempt.id,
        event_type="started",
        details="Attempt started securely"
    )
    db.add(log)
    db.commit()
    
    return {
        "attempt_id": attempt.id,
        "questions": formatted_questions,
        "started_at": attempt.started_at.isoformat()
    }

@router.post("/{id}/answer")
def save_student_answer(
    id: str,
    answer_in: schemas.StudentAnswerSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit answers")
        
    student_id = current_user.linked_id
    assign = db.query(models.TestAssignment).filter(
        models.TestAssignment.id == id,
        models.TestAssignment.student_id == student_id
    ).first()
    
    if not assign:
        raise HTTPException(status_code=404, detail="Test assignment not found")
        
    # Find latest attempt
    attempt = db.query(models.TestAttempt).filter(
        models.TestAttempt.test_assignment_id == assign.id
    ).order_by(models.TestAttempt.started_at.desc()).first()
    
    if not attempt or attempt.submitted_at is not None:
        raise HTTPException(status_code=400, detail="No active attempt found for this test")
        
    # Check if answer exists
    existing = db.query(models.StudentAnswer).filter(
        models.StudentAnswer.attempt_id == attempt.id,
        models.StudentAnswer.question_id == answer_in.question_id
    ).first()
    
    if existing:
        existing.answer_text = answer_in.answer_text
        existing.marked_for_review = answer_in.marked_for_review
    else:
        db_answer = models.StudentAnswer(
            attempt_id=attempt.id,
            question_id=answer_in.question_id,
            answer_text=answer_in.answer_text,
            marked_for_review=answer_in.marked_for_review
        )
        db.add(db_answer)
        
    # Log saved answer activity
    log = models.TestActivityLog(
        attempt_id=attempt.id,
        event_type="answered",
        details=f"Answer saved for question {answer_in.question_id}"
    )
    db.add(log)
    db.commit()
    return {"message": "Answer saved successfully"}

@router.post("/{id}/log-activity")
def log_test_activity(
    id: str,
    log_in: schemas.ActivityLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can log activity")
        
    student_id = current_user.linked_id
    assign = db.query(models.TestAssignment).filter(
        models.TestAssignment.id == id,
        models.TestAssignment.student_id == student_id
    ).first()
    
    if not assign:
        raise HTTPException(status_code=404, detail="Test assignment not found")
        
    attempt = db.query(models.TestAttempt).filter(
        models.TestAttempt.test_assignment_id == assign.id
    ).order_by(models.TestAttempt.started_at.desc()).first()
    
    if not attempt or attempt.submitted_at is not None:
        raise HTTPException(status_code=400, detail="No active attempt found for this test")
        
    # Increment counts on attempt
    if log_in.event_type == "tab_switched":
        attempt.tab_switch_count += 1
    elif log_in.event_type == "fullscreen_exited":
        attempt.fullscreen_exit_count += 1
        
    log = models.TestActivityLog(
        attempt_id=attempt.id,
        event_type=log_in.event_type,
        details=log_in.details
    )
    db.add(log)
    db.commit()
    return {"message": "Activity logged successfully"}

@router.post("/{id}/submit")
def submit_student_test(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit tests")
        
    student_id = current_user.linked_id
    assign = db.query(models.TestAssignment).filter(
        models.TestAssignment.id == id,
        models.TestAssignment.student_id == student_id
    ).first()
    
    if not assign:
        raise HTTPException(status_code=404, detail="Test assignment not found")
        
    attempt = db.query(models.TestAttempt).filter(
        models.TestAttempt.test_assignment_id == assign.id
    ).order_by(models.TestAttempt.started_at.desc()).first()
    
    if not attempt or attempt.submitted_at is not None:
        raise HTTPException(status_code=400, detail="No active attempt found for this test")
        
    # Mark submitted
    attempt.submitted_at = datetime.utcnow()
    attempt.time_taken = int((attempt.submitted_at - attempt.started_at).total_seconds())
    
    # Auto grading
    questions = db.query(models.Question).filter(models.Question.test_id == assign.test_id).all()
    saved_answers = db.query(models.StudentAnswer).filter(models.StudentAnswer.attempt_id == attempt.id).all()
    answers_map = {ans.question_id: ans for ans in saved_answers}
    
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    
    for q in questions:
        ans = answers_map.get(q.id)
        if not ans or not ans.answer_text or ans.answer_text.strip() == "":
            unanswered_count += 1
            if ans:
                ans.is_correct = False
            else:
                # Create empty answer record
                empty_ans = models.StudentAnswer(
                    attempt_id=attempt.id,
                    question_id=q.id,
                    answer_text="",
                    is_correct=False
                )
                db.add(empty_ans)
            continue
            
        student_ans_str = ans.answer_text.strip()
        correct_ans_str = q.correct_answer.strip()
        
        is_correct = False
        
        q_type_lower = q.question_type.lower()
        if "multiple select" in q_type_lower:
            # Parse both as lists / JSON arrays
            try:
                student_list = json.loads(student_ans_str)
                correct_list = json.loads(correct_ans_str)
                if isinstance(student_list, list) and isinstance(correct_list, list):
                    # Sort and lower compare
                    student_set = {str(item).strip().lower() for item in student_list}
                    correct_set = {str(item).strip().lower() for item in correct_list}
                    is_correct = student_set == correct_set
            except Exception:
                is_correct = student_ans_str.lower() == correct_ans_str.lower()
        elif "short answer" in q_type_lower or "fill in the blank" in q_type_lower:
            # Check if student answer contains core keywords or matches
            is_correct = student_ans_str.lower() == correct_ans_str.lower()
        else:  # MCQ, True/False
            is_correct = student_ans_str.lower() == correct_ans_str.lower()
            
        ans.is_correct = is_correct
        if is_correct:
            correct_count += 1
        else:
            incorrect_count += 1
            
    attempt.correct_count = correct_count
    attempt.incorrect_count = incorrect_count
    attempt.unanswered_count = unanswered_count
    
    total_q = len(questions)
    attempt.score = float(correct_count)
    attempt.percentage = (correct_count / total_q * 100.0) if total_q > 0 else 0.0
    attempt.accuracy = (correct_count / (correct_count + incorrect_count)) if (correct_count + incorrect_count) > 0 else 0.0
    
    assign.status = "Completed"
    
    # Update StudentTopicPerformance records
    for q in questions:
        ans = answers_map.get(q.id)
        is_correct = ans.is_correct if ans else False
        
        # Check topic performance
        topic_perf = db.query(models.StudentTopicPerformance).filter(
            models.StudentTopicPerformance.student_id == student_id,
            models.StudentTopicPerformance.subject.ilike(q.subject),
            models.StudentTopicPerformance.topic.ilike(q.topic)
        ).first()
        
        if topic_perf:
            topic_perf.total_questions += 1
            if is_correct:
                topic_perf.correct_questions += 1
            topic_perf.accuracy = topic_perf.correct_questions / topic_perf.total_questions
        else:
            new_perf = models.StudentTopicPerformance(
                student_id=student_id,
                subject=q.subject,
                topic=q.topic,
                total_questions=1,
                correct_questions=1 if is_correct else 0,
                accuracy=1.0 if is_correct else 0.0
            )
            db.add(new_perf)
            
    # Log submit activity
    log = models.TestActivityLog(
        attempt_id=attempt.id,
        event_type="submitted",
        details=f"Test submitted successfully. Score: {correct_count}/{total_q}"
    )
    db.add(log)
    db.commit()
    
    return {
        "score": attempt.score,
        "percentage": attempt.percentage,
        "correct_count": attempt.correct_count,
        "incorrect_count": attempt.incorrect_count,
        "unanswered_count": attempt.unanswered_count,
        "accuracy": attempt.accuracy,
        "time_taken": attempt.time_taken
    }

@router.get("/{id}/result")
def get_student_test_result(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view results")
        
    student_id = current_user.linked_id
    assign = db.query(models.TestAssignment).filter(
        models.TestAssignment.id == id,
        models.TestAssignment.student_id == student_id
    ).first()
    
    if not assign:
        raise HTTPException(status_code=404, detail="Test assignment not found")
        
    if not assign.show_result_immediately and assign.status != "Completed":
        raise HTTPException(status_code=403, detail="Test results are not available yet")
        
    attempt = db.query(models.TestAttempt).filter(
        models.TestAttempt.test_assignment_id == assign.id
    ).order_by(models.TestAttempt.started_at.desc()).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="No test attempt found")
        
    # Get questions list
    questions = db.query(models.Question).filter(models.Question.test_id == assign.test_id).all()
    saved_answers = db.query(models.StudentAnswer).filter(models.StudentAnswer.attempt_id == attempt.id).all()
    answers_map = {ans.question_id: ans for ans in saved_answers}
    
    # Format questions response
    questions_data = []
    for q in questions:
        ans = answers_map.get(q.id)
        
        # Parse options
        opts = []
        if q.options:
            try:
                opts = json.loads(q.options)
            except Exception:
                opts = []
                
        q_info = {
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": opts,
            "difficulty": q.difficulty,
            "subject": q.subject,
            "topic": q.topic,
            "subtopic": q.subtopic,
            "student_answer": ans.answer_text if ans else None,
            "is_correct": ans.is_correct if ans else False
        }
        
        # Show correct answer and explanation only if authorized
        if assign.show_correct_answers:
            q_info["correct_answer"] = q.correct_answer
            q_info["explanation"] = q.explanation
            
        questions_data.append(q_info)
        
    return {
        "assignment_id": assign.id,
        "test_id": assign.test_id,
        "status": assign.status,
        "score": attempt.score,
        "percentage": attempt.percentage,
        "correct_count": attempt.correct_count,
        "incorrect_count": attempt.incorrect_count,
        "unanswered_count": attempt.unanswered_count,
        "accuracy": attempt.accuracy,
        "time_taken": attempt.time_taken,
        "tab_switches": attempt.tab_switch_count,
        "fullscreen_exits": attempt.fullscreen_exit_count,
        "questions": questions_data
    }
