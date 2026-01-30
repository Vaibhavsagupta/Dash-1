from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Submission, Assignment
from pydantic import BaseModel
import re

router = APIRouter(
    prefix="/autograder",
    tags=["autograder"]
)

class GradingRequest(BaseModel):
    submission_id: str

class GradingResult(BaseModel):
    score: int
    feedback: str

def run_simple_heuristic_grader(content: str, assignment_type: str = "general") -> (int, str):
    """
    A simulated auto-grader.
    In a real app, this would use `subprocess` to run tests (pytest) or call an LLM.
    For now, we use keyword heuristics to Grade.
    """
    score = 0
    feedback = []
    
    content_lower = content.lower()
    
    # Check length
    if len(content) < 50:
        feedback.append("Submission is too short.")
        score += 10
    else:
        score += 40
        feedback.append("Good length.")
        
    # Check for keywords (simulating correct logic)
    keywords = ["def ", "class ", "return", "import"]
    found_keywords = [k for k in keywords if k in content_lower]
    
    if len(found_keywords) >= 3:
        score += 40
        feedback.append("Code structure looks valid (functions/classes found).")
    else:
        score += 10
        feedback.append(f"Missing key code structure elements. Found: {found_keywords}")
        
    # Check for comments
    if "#" in content:
        score += 20
        feedback.append("Code is commented.")
    else:
        feedback.append("No comments found (deducting points).")
        
    return min(100, score), " ".join(feedback)

@router.post("/grade/{submission_id}", response_model=GradingResult)
def grade_submission(submission_id: str, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if not submission.content:
        raise HTTPException(status_code=400, detail="Processing failed: No content to grade")

    # Run the grader
    score, feedback = run_simple_heuristic_grader(submission.content)
    
    # Save results
    submission.score = score
    submission.feedback = feedback
    db.commit()
    
    return {"score": score, "feedback": feedback}
