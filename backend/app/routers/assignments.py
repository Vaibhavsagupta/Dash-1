from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import date
from typing import List
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user_obj as get_current_user

router = APIRouter(
    prefix="/assignments",
    tags=["assignments"],
)

@router.get("/", response_model=List[schemas.AssignmentResponse])
def get_assignments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Determine the context based on user role
    # If teacher, show their created assignments
    # If student, show assignments for their batch (logic TBD, for now show all or filter by batch if we knew it)
    # For now, let's keep it Teacher-focused as originally built, but we can allow students to see them too.
    
    if current_user.role == "teacher":
        teacher_id = current_user.linked_id
        assignments = db.query(models.Assignment).filter(models.Assignment.teacher_id == teacher_id).order_by(models.Assignment.due_date).all()
        return assignments
    elif current_user.role == "student":
        # Show all active assignments for now (simplified)
        assignments = db.query(models.Assignment).filter(models.Assignment.status == models.AssignmentStatus.active).all()
        return assignments
        
    raise HTTPException(status_code=403, detail="Not authorized")

@router.post("/{assignment_id}/submit")
def submit_assignment(
    assignment_id: str,
    content: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments")

    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check Expiry
    if assignment.due_date < date.today():
        raise HTTPException(status_code=400, detail="Assignment expired. Submission rejected.")
        
    if assignment.status != models.AssignmentStatus.active:
         raise HTTPException(status_code=400, detail="Assignment is closed.")

    sub = models.Submission(
        assignment_id=assignment.id,
        student_id=current_user.linked_id,
        content=content
    )
    db.add(sub)
    db.commit()
    return {"message": "Submission successful"}

@router.get("/{assignment_id}/submissions")
def get_assignment_submissions(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.teacher_id != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these submissions")

    submission_query = db.query(models.Submission, models.Student.name)\
        .join(models.Student, models.Submission.student_id == models.Student.student_id)\
        .filter(models.Submission.assignment_id == assignment_id).all()
        
    results = []
    for sub, name in submission_query:
        results.append({
            "id": sub.id,
            "student_id": sub.student_id,
            "student_name": name,
            "submitted_at": sub.submitted_at,
            "content": sub.content
        })
    return results

@router.post("/", response_model=schemas.AssignmentResponse)
def create_assignment(
    assignment: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_assignment = models.Assignment(
        teacher_id=current_user.linked_id,
        title=assignment.title,
        description=assignment.description,
        batch=assignment.batch,
        due_date=assignment.due_date,
        status=assignment.status
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.put("/{assignment_id}", response_model=schemas.AssignmentResponse)
def update_assignment(
    assignment_id: str,
    update_data: schemas.AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.teacher_id != current_user.linked_id:
         raise HTTPException(status_code=403, detail="Not authorized to edit this assignment")
         
    if update_data.title is not None:
        assignment.title = update_data.title
    if update_data.description is not None:
        assignment.description = update_data.description
    if update_data.batch is not None:
        assignment.batch = update_data.batch
    if update_data.due_date is not None:
        assignment.due_date = update_data.due_date
    if update_data.status is not None:
        assignment.status = update_data.status
        
    db.commit()
    db.refresh(assignment)
    return assignment

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.teacher_id != current_user.linked_id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this assignment")
         
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted"}
