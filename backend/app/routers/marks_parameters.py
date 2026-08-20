from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, database, auth, schemas

router = APIRouter(
    prefix="/marks-parameters",
    tags=["Marks Parameters"]
)

# Admin or Teacher Dependency
def admin_or_teacher(current_user: models.User = Depends(auth.get_current_user_obj), db: Session = Depends(database.get_db)):
    if current_user.role in [models.UserRole.admin, models.UserRole.teacher]:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Faculty or Admin access required"
    )

@router.get("", response_model=List[schemas.MarksParameterResponse])
def get_parameters(db: Session = Depends(database.get_db), current_user: models.User = Depends(admin_or_teacher)):
    return db.query(models.MarksParameter).all()

@router.post("", response_model=schemas.MarksParameterResponse)
def create_parameter(param_in: schemas.MarksParameterCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(admin_or_teacher)):
    # Check if duplicate name for same subject and semester
    existing = db.query(models.MarksParameter).filter(
        models.MarksParameter.parameter_name == param_in.parameter_name,
        models.MarksParameter.subject == param_in.subject,
        models.MarksParameter.semester == param_in.semester
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Marks parameter already exists for this subject and semester.")

    db_param = models.MarksParameter(
        parameter_name=param_in.parameter_name,
        description=param_in.description,
        max_marks=param_in.max_marks,
        weightage=param_in.weightage,
        subject=param_in.subject,
        semester=param_in.semester,
        status=param_in.status
    )
    db.add(db_param)
    db.commit()
    db.refresh(db_param)
    return db_param

@router.put("/{id}", response_model=schemas.MarksParameterResponse)
def update_parameter(id: str, param_in: schemas.MarksParameterCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(admin_or_teacher)):
    db_param = db.query(models.MarksParameter).filter(models.MarksParameter.id == id).first()
    if not db_param:
        raise HTTPException(status_code=404, detail="Marks parameter not found.")

    db_param.parameter_name = param_in.parameter_name
    db_param.description = param_in.description
    db_param.max_marks = param_in.max_marks
    db_param.weightage = param_in.weightage
    db_param.subject = param_in.subject
    db_param.semester = param_in.semester
    db_param.status = param_in.status

    db.commit()
    db.refresh(db_param)
    return db_param

@router.delete("/{id}")
def delete_parameter(id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(admin_or_teacher)):
    db_param = db.query(models.MarksParameter).filter(models.MarksParameter.id == id).first()
    if not db_param:
        raise HTTPException(status_code=404, detail="Marks parameter not found.")

    # Delete marks associated
    db.query(models.StudentParameterMark).filter(models.StudentParameterMark.parameter_id == id).delete()
    db.delete(db_param)
    db.commit()
    return {"message": "Parameter and associated student marks deleted successfully."}

@router.get("/marks/{parameter_id}")
def get_parameter_marks(parameter_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(admin_or_teacher)):
    param = db.query(models.MarksParameter).filter(models.MarksParameter.id == parameter_id).first()
    if not param:
        raise HTTPException(status_code=404, detail="Marks parameter not found.")

    # Get students
    students_query = db.query(models.Student)
    if current_user.role == models.UserRole.teacher:
        teacher_id = current_user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        students_query = students_query.filter(models.Student.batch_id.in_(batch_list))

    students = students_query.all()

    # Get existing marks
    marks = db.query(models.StudentParameterMark).filter(models.StudentParameterMark.parameter_id == parameter_id).all()
    marks_map = {m.student_id: m.score for m in marks}

    result = []
    for s in students:
        result.append({
            "student_id": s.student_id,
            "name": s.name,
            "batch_id": s.batch_id,
            "score": marks_map.get(s.student_id, 0.0)
        })
    return result

@router.post("/marks/{parameter_id}/bulk")
def save_parameter_marks_bulk(parameter_id: str, marks_in: List[schemas.StudentParameterMarkSubmit], db: Session = Depends(database.get_db), current_user: models.User = Depends(admin_or_teacher)):
    param = db.query(models.MarksParameter).filter(models.MarksParameter.id == parameter_id).first()
    if not param:
        raise HTTPException(status_code=404, detail="Marks parameter not found.")

    # Permissions batch check for teacher
    batch_list = []
    if current_user.role == models.UserRole.teacher:
        teacher_id = current_user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]

    updated_count = 0
    for mark in marks_in:
        student = db.query(models.Student).filter(models.Student.student_id == mark.student_id).first()
        if not student:
            continue

        if current_user.role == models.UserRole.teacher and student.batch_id not in batch_list:
            continue  # Skip unauthorized students

        # Update or Insert mark record
        existing = db.query(models.StudentParameterMark).filter(
            models.StudentParameterMark.student_id == mark.student_id,
            models.StudentParameterMark.parameter_id == parameter_id
        ).first()

        if existing:
            existing.score = mark.score
        else:
            db_mark = models.StudentParameterMark(
                student_id=mark.student_id,
                parameter_id=parameter_id,
                score=mark.score
            )
            db.add(db_mark)

        # Sync to Student table if this is a default parameter
        name_lower = param.parameter_name.lower().strip()
        if name_lower == "dsa":
            student.dsa_score = int(mark.score)
        elif name_lower == "ml":
            student.ml_score = int(mark.score)
        elif name_lower == "qa":
            student.qa_score = int(mark.score)
        elif name_lower == "projects":
            student.projects_score = int(mark.score)
        elif name_lower == "mock interview":
            student.mock_interview_score = int(mark.score)

        updated_count += 1

    db.commit()
    return {"message": f"Successfully updated marks for {updated_count} students."}
