from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student
from pydantic import BaseModel
import random

router = APIRouter(
    prefix="/ai",
    tags=["ai-generation"]
)

class AIReportRequest(BaseModel):
    student_id: str

class AIReportResponse(BaseModel):
    student_id: str
    report: str

def generate_mock_ai_report(student: Student) -> str:
    """
    Simulates a call to a Large Language Model (e.g., Gemini, OpenAI).
    Constructs a prompt based on student data and returns a structured response.
    """
    
    # Analyze strengths and weaknesses
    scores = {
        "DSA": student.dsa_score,
        "Machine Learning": student.ml_score,
        "QA Testing": student.qa_score,
        "Projects": student.projects_score * 20, # normalize to 100 roughly
        "Mock Interview": student.mock_interview_score
    }
    
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_subject, best_score = sorted_scores[0]
    worst_subject, worst_score = sorted_scores[-1]
    
    # Attendance Analysis
    attendance_comment = ""
    if student.attendance > 90:
        attendance_comment = "demonstrates excellent consistency and dedication."
    elif student.attendance > 75:
        attendance_comment = "maintains good attendance but could be more regular."
    else:
        attendance_comment = "is struggling with attendance, which is impacting their learning momentum."
        
    # Templates
    templates = [
        f"Based on the performance data, {student.name} shows a strong aptitude for {best_subject}, achieving a score of {best_score}. However, they require immediate focus on {worst_subject} ({worst_score}). In terms of discipline, {student.name} {attendance_comment}",
        f"The student {student.name} is performing exceptionally well in {best_subject}. To improve their overall Placement Readiness, they should dedicate the next 2 weeks to improving {worst_subject}. {student.name} {attendance_comment}",
        f"An analysis of {student.name}'s metrics indicates they are a {best_subject} specialist. However, a well-rounded profile requires better scores in {worst_subject}. {attendance_comment}"
    ]
    
    base_report = random.choice(templates)
    
    # specific advice
    advice = ""
    if worst_subject == "DSA":
        advice = "Recommended Action: Assign 5 LeetCode medium problems daily."
    elif worst_subject == "Machine Learning":
        advice = "Recommended Action: Review the 'Neural Networks' module and complete a small regression project."
    elif worst_subject == "Mock Interview":
        advice = "Recommended Action: Schedule a 1:1 behavioral coaching session."
    
    return f"{base_report} \n\n{advice}"

from .. import auth, models

@router.post("/generate-report", response_model=AIReportResponse)
def generate_report(req: AIReportRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    # Security Check
    if current_user.role == models.UserRole.student and current_user.linked_id != req.student_id:
        raise HTTPException(status_code=403, detail="Not authorized to generate reports for other students")
    
    # Teachers can only generate for their students
    if current_user.role == models.UserRole.teacher:
        teacher_id = current_user.linked_id
        student = db.query(models.Student).filter(models.Student.student_id == req.student_id).first()
        if not student:
             raise HTTPException(status_code=404, detail="Student not found")
        
        assignment_exists = db.query(models.Lecture).filter(
            models.Lecture.teacher_id == teacher_id,
            models.Lecture.batch == student.batch_id
        ).first()
        if not assignment_exists:
            raise HTTPException(status_code=403, detail="Not authorized to access reports for students in other batches")

    student = db.query(models.Student).filter(models.Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # In a real app, here calls `openai.ChatCompletion.create(...)`
    report_text = generate_mock_ai_report(student)
    
    return {"student_id": student.student_id, "report": report_text}
