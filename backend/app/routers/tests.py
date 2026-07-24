from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import json

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user_obj as get_current_user
from ..services.ai import generate_questions

router = APIRouter(
    prefix="/tests",
    tags=["tests"],
)

@router.post("", response_model=schemas.TestResponse)
def create_test(
    test_in: schemas.TestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create tests")
    
    db_test = models.Test(
        teacher_id=current_user.linked_id,
        name=test_in.name,
        subject=test_in.subject,
        topic=test_in.topic,
        description=test_in.description,
        duration=test_in.duration,
        passing_marks=test_in.passing_marks,
        difficulty=test_in.difficulty,
        approved=False
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    return db_test

@router.post("/generate-questions")
def generate_test_questions(
    subject: str = Form(...),
    topic: str = Form(...),
    syllabus: str = Form(...),
    question_types_json: str = Form(...),  # JSON array string
    count: int = Form(...),
    difficulty: str = Form(...),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can generate questions")
    
    try:
        question_types = json.loads(question_types_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON array for question_types_json")
        
    try:
        questions = generate_questions(
            subject=subject,
            topic=topic,
            syllabus=syllabus,
            question_types=question_types,
            count=count,
            difficulty=difficulty
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

MOCK_SYLLABUS_FALLBACK = """
Syllabus Overview:
1. Data Structures & Algorithms:
   - Arrays, LinkedLists, Binary Search Trees
   - Time complexities of sorting and searching algorithms (O(N), O(log N))
2. Machine Learning:
   - Supervised Learning: Linear Regression, Neural Networks
   - Key concepts: Activation Functions, Backpropagation, Overfitting
3. Databases & Networking:
   - Relational Database Schemas and Primary Keys
   - Stateful vs Stateless communication (HTTP/HTTPS)
"""

def extract_text_from_image(image_bytes: bytes, mime_type: str) -> dict:
    import base64
    import os
    import urllib.request
    import json
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {
            "content": MOCK_SYLLABUS_FALLBACK,
            "warning": "GEMINI_API_KEY environment variable is not set. Please add GEMINI_API_KEY to your backend/.env file to enable live image OCR."
        }
        
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Extract all readable text, topics, subtopics, and syllabus structure from this image. Do not include markdown wraps, just return the plain text of the syllabus."
                    },
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_image
                        }
                    }
                ]
            }
        ]
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text_out = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return {"content": text_out.strip(), "warning": None}
    except Exception as e:
        error_msg = str(e)
        warning_msg = "Gemini API image extraction failed (using offline fallback). "
        if "403" in error_msg:
            warning_msg += "Your GEMINI_API_KEY has been reported as leaked/invalid by Google. Please replace it with a valid key in backend/.env."
        else:
            warning_msg += f"Error details: {error_msg}"
            
        return {
            "content": MOCK_SYLLABUS_FALLBACK,
            "warning": warning_msg
        }

@router.post("/upload-syllabus")
def upload_syllabus(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can upload syllabus")
    
    filename = file.filename.lower()
    allowed_extensions = (".txt", ".pdf", ".png", ".jpg", ".jpeg", ".webp")
    if not filename.endswith(allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail="Only .txt, .pdf, and image files (.png, .jpg, .jpeg, .webp) are supported"
        )
        
    try:
        contents = file.file.read()
        warning = None
        if filename.endswith(".txt"):
            text_content = contents.decode("utf-8", errors="ignore")
        elif filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
            # Determine MIME type
            mime_type = "image/png"
            if filename.endswith((".jpg", ".jpeg")):
                mime_type = "image/jpeg"
            elif filename.endswith(".webp"):
                mime_type = "image/webp"
                
            res = extract_text_from_image(contents, mime_type)
            text_content = res["content"]
            warning = res["warning"]
        else:
            # Simple fallback for PDF file binary parsing
            try:
                import re
                strings = re.findall(b"[a-zA-Z0-9\\s\\.,;:!\\?\\(\\)\\{\\}\\[\\]\\+\\-\\*\\/]{4,}", contents)
                decoded_strings = []
                for s in strings:
                    try:
                        decoded_strings.append(s.decode("ascii"))
                    except Exception:
                        pass
                text_content = " ".join(decoded_strings)
                if len(text_content.strip()) < 50:
                    text_content = "[PDF text extraction empty. Please copy and paste the syllabus text directly or use a .txt file.]"
            except Exception:
                text_content = "[Failed to parse PDF binary. Please copy and paste the syllabus text directly or use a .txt file.]"
                
        return {"filename": file.filename, "content": text_content, "warning": warning}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.get("/{id}", response_model=schemas.TestResponse)
def get_test(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    test = db.query(models.Test).filter(models.Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    questions = db.query(models.Question).filter(models.Question.test_id == id).all()
    test.questions = questions
    return test

@router.put("/{id}", response_model=schemas.TestResponse)
def update_test(
    id: str,
    test_in: schemas.TestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can update tests")
        
    test = db.query(models.Test).filter(models.Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    test.name = test_in.name
    test.subject = test_in.subject
    test.topic = test_in.topic
    test.description = test_in.description
    test.duration = test_in.duration
    test.passing_marks = test_in.passing_marks
    test.difficulty = test_in.difficulty
    
    db.commit()
    db.refresh(test)
    return test

@router.delete("/{id}")
def delete_test(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete tests")
        
    test = db.query(models.Test).filter(models.Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    db.delete(test)
    db.commit()
    return {"message": "Test deleted successfully"}

@router.post("/{id}/approve")
def approve_test(
    id: str,
    questions: List[schemas.QuestionCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can approve tests")
        
    test = db.query(models.Test).filter(models.Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    # Delete existing questions
    db.query(models.Question).filter(models.Question.test_id == id).delete()
    
    # Save approved questions
    for q in questions:
        db_question = models.Question(
            test_id=id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=json.dumps(q.options) if q.options else None,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            difficulty=q.difficulty,
            subject=q.subject,
            topic=q.topic,
            subtopic=q.subtopic
        )
        db.add(db_question)
        
    test.approved = True
    db.commit()
    return {"message": "Test approved and questions saved successfully"}

@router.get("/{id}/eligible-students")
def get_eligible_students(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can retrieve eligible students")
        
    test = db.query(models.Test).filter(models.Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    students = db.query(models.Student).all()
    recommendations = []
    
    subject_lower = test.subject.lower()
    
    for s in students:
        reason = None
        recommended = False
        
        # Check overall subject score
        subject_score = 100
        if "dsa" in subject_lower or "data structures" in subject_lower:
            subject_score = s.dsa_score
        elif "ml" in subject_lower or "machine learning" in subject_lower:
            subject_score = s.ml_score
        elif "qa" in subject_lower or "quantitative" in subject_lower:
            subject_score = s.qa_score
        else:
            # Average score fallback
            subject_score = (s.dsa_score + s.ml_score + s.qa_score) / 3.0
            
        # Check specific topic performance
        topic_perf = db.query(models.StudentTopicPerformance).filter(
            models.StudentTopicPerformance.student_id == s.student_id,
            models.StudentTopicPerformance.subject.ilike(test.subject),
            models.StudentTopicPerformance.topic.ilike(test.topic)
        ).first()
        
        if topic_perf and topic_perf.accuracy < 0.60:
            recommended = True
            reason = f"Weak topic performance ({int(topic_perf.accuracy * 100)}% accuracy)"
        elif subject_score < 60:
            recommended = True
            reason = f"Low overall subject score ({int(subject_score)}/100)"
        elif s.rag_status in ["Red", "Amber"]:
            recommended = True
            reason = f"Student is flagged in RAG status ({s.rag_status})"
            
        recommendations.append({
            "student_id": s.student_id,
            "name": s.name,
            "subject_score": subject_score,
            "rag_status": s.rag_status,
            "topic_accuracy": topic_perf.accuracy if topic_perf else None,
            "recommended": recommended,
            "reason": reason
        })
        
    return recommendations

@router.post("/{id}/assign")
def assign_test(
    id: str,
    assign_in: schemas.TestAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can assign tests")
        
    test = db.query(models.Test).filter(models.Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    for s_id in assign_in.student_ids:
        # Avoid duplicate assignments
        existing = db.query(models.TestAssignment).filter(
            models.TestAssignment.test_id == id,
            models.TestAssignment.student_id == s_id
        ).first()
        
        if existing:
            # If exists, update dates and status to active
            existing.start_date = assign_in.start_date
            existing.end_date = assign_in.end_date
            existing.randomize_questions = assign_in.randomize_questions
            existing.randomize_options = assign_in.randomize_options
            existing.allow_retake = assign_in.allow_retake
            existing.show_result_immediately = assign_in.show_result_immediately
            existing.show_correct_answers = assign_in.show_correct_answers
            existing.status = "Pending"
        else:
            db_assign = models.TestAssignment(
                test_id=id,
                student_id=s_id,
                assigned_by=current_user.linked_id,
                start_date=assign_in.start_date,
                end_date=assign_in.end_date,
                randomize_questions=assign_in.randomize_questions,
                randomize_options=assign_in.randomize_options,
                allow_retake=assign_in.allow_retake,
                show_result_immediately=assign_in.show_result_immediately,
                show_correct_answers=assign_in.show_correct_answers,
                status="Pending"
            )
            db.add(db_assign)
            
    db.commit()
    return {"message": "Test assigned to students successfully"}

@router.get("/{id}/analytics")
def get_test_analytics(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view test analytics")
        
    test = db.query(models.Test).filter(models.Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    assignments = db.query(models.TestAssignment).filter(models.TestAssignment.test_id == id).all()
    assignment_ids = [a.id for a in assignments]
    
    attempts = db.query(models.TestAttempt).filter(
        models.TestAttempt.test_assignment_id.in_(assignment_ids)
    ).all() if assignment_ids else []
    
    scores = [a.score for a in attempts if a.score is not None]
    accuracies = [a.accuracy for a in attempts if a.accuracy is not None]
    
    highest_score = max(scores) if scores else 0
    lowest_score = min(scores) if scores else 0
    avg_score = sum(scores) / len(scores) if scores else 0
    avg_accuracy = sum(accuracies) / len(accuracies) if accuracies else 0
    
    # Details per student
    student_details = []
    for assign in assignments:
        student = db.query(models.Student).filter(models.Student.student_id == assign.student_id).first()
        student_name = student.name if student else "Unknown"
        
        attempt = db.query(models.TestAttempt).filter(
            models.TestAttempt.test_assignment_id == assign.id
        ).order_by(models.TestAttempt.started_at.desc()).first()
        
        warnings = []
        if attempt:
            # Query security logs
            logs = db.query(models.TestActivityLog).filter(
                models.TestActivityLog.attempt_id == attempt.id,
                models.TestActivityLog.event_type.in_(["tab_switched", "fullscreen_exited"])
            ).all()
            for l in logs:
                warnings.append({
                    "event_type": l.event_type,
                    "details": l.details,
                    "timestamp": l.timestamp.isoformat() if l.timestamp else None
                })
                
        student_details.append({
            "student_id": assign.student_id,
            "name": student_name,
            "status": assign.status,
            "score": attempt.score if attempt else None,
            "percentage": attempt.percentage if attempt else None,
            "accuracy": attempt.accuracy if attempt else None,
            "time_taken": attempt.time_taken if attempt else None,
            "tab_switches": attempt.tab_switch_count if attempt else 0,
            "fullscreen_exits": attempt.fullscreen_exit_count if attempt else 0,
            "submitted_at": attempt.submitted_at.isoformat() if attempt and attempt.submitted_at else None,
            "warnings": warnings
        })
        
    # Topic breakdown (how students performed on each question/subtopic)
    questions = db.query(models.Question).filter(models.Question.test_id == id).all()
    question_stats = []
    for q in questions:
        answers = db.query(models.StudentAnswer).filter(models.StudentAnswer.question_id == q.id).all()
        total_answers = len(answers)
        correct_answers = sum(1 for ans in answers if ans.is_correct)
        accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0
        
        question_stats.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "subtopic": q.subtopic,
            "total_attempts": total_answers,
            "correct_attempts": correct_answers,
            "accuracy_percent": accuracy
        })
        
    return {
        "test_id": id,
        "name": test.name,
        "subject": test.subject,
        "topic": test.topic,
        "total_assigned": len(assignments),
        "total_attempts": len(attempts),
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "average_score": avg_score,
        "average_accuracy": avg_accuracy * 100,
        "students": student_details,
        "questions": question_stats
    }
