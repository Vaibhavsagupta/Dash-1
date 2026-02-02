from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/update",
    tags=["update"]
)

# Admin or Teacher Dependency
def admin_or_teacher(current_user: models.User = Depends(auth.get_current_user_obj), db: Session = Depends(database.get_db)):
    if current_user.role == models.UserRole.admin:
        # Phase 1 Requirement: Only specific admins can fetch data
        allowed_admins = ["admin@college.com", "admin@samatrix.com"]
        if current_user.email not in allowed_admins:
            # Check admins table for approval
            admin_entry = db.query(models.Admin).filter(models.Admin.email == current_user.email).first()
            if not admin_entry or not admin_entry.approved:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Admin not approved or not in allowed list."
                )
    elif current_user.role != models.UserRole.teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty access required"
        )
    return current_user

@router.put("/student/{student_id}")
def update_student(
    student_id: str, 
    update_data: schemas.StudentUpdate, 
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Batch Isolation for Teachers
    if user.role == models.UserRole.teacher:
        teacher_id = user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        
        if student.batch_id not in batch_list:
            raise HTTPException(status_code=403, detail="Faculty can only update students in their assigned batches")
    
    # Update fields if provided
    if update_data.attendance is not None: student.attendance = update_data.attendance
    if update_data.dsa_score is not None: student.dsa_score = update_data.dsa_score
    if update_data.ml_score is not None: student.ml_score = update_data.ml_score
    if update_data.qa_score is not None: student.qa_score = update_data.qa_score
    if update_data.projects_score is not None: student.projects_score = update_data.projects_score
    if update_data.mock_interview_score is not None: student.mock_interview_score = update_data.mock_interview_score
    
    db.commit()
    db.refresh(student)
    return {"message": "Student updated successfully", "student": student}

@router.put("/teacher/{teacher_id}")
def update_teacher(
    teacher_id: str, 
    update_data: schemas.TeacherUpdate, 
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(admin_or_teacher)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.teacher_id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    if update_data.avg_improvement is not None: teacher.avg_improvement = update_data.avg_improvement
    if update_data.feedback_score is not None: teacher.feedback_score = update_data.feedback_score
    if update_data.content_quality_score is not None: teacher.content_quality_score = update_data.content_quality_score
    if update_data.placement_conversion is not None: teacher.placement_conversion = update_data.placement_conversion

    db.commit()
    db.refresh(teacher)
    return {"message": "Teacher updated successfully", "teacher": teacher}

@router.get("/list/students")
def list_students(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    query = db.query(models.Student)
    if user.role == models.UserRole.teacher:
        teacher_id = user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        query = query.filter(models.Student.batch_id.in_(batch_list))
    return query.all()

@router.post("/student/add")
def create_student(
    student_data: schemas.StudentCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(auth.get_current_active_admin)
):
    # Check if exists
    existing_student = db.query(models.Student).filter(models.Student.student_id == student_data.student_id).first()
    if existing_student:
        raise HTTPException(status_code=400, detail="Student ID already exists")

    new_student = models.Student(
        student_id=student_data.student_id,
        name=student_data.name,
        attendance=student_data.attendance,
        dsa_score=student_data.dsa_score,
        ml_score=student_data.ml_score,
        qa_score=student_data.qa_score,
        projects_score=student_data.projects_score,
        mock_interview_score=student_data.mock_interview_score
    )
    db.add(new_student)
    
    # Automatically create a User account for the student
    # Default Email: [Student_ID]@university.edu
    # Default Password: [Student_ID]
    student_email = f"{student_data.student_id}@university.edu".lower()
    existing_user = db.query(models.User).filter(models.User.email == student_email).first()
    
    if not existing_user:
        hashed_password = auth.get_password_hash(student_data.student_id)
        new_user = models.User(
            email=student_email,
            password_hash=hashed_password,
            role=models.UserRole.student,
            linked_id=student_data.student_id,
            approved=True
        )
        db.add(new_user)

    db.commit()
    db.refresh(new_student)
    
    msg = "Student created successfully."
    if not existing_user:
        msg += f" User account created: {student_email} / {student_data.student_id}"

    return {"message": msg, "student": new_student}

@router.post("/teacher/add")
def create_teacher(
    teacher_data: schemas.TeacherCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(auth.get_current_active_admin)
):
    # Check if exists
    existing_teacher = db.query(models.Teacher).filter(models.Teacher.teacher_id == teacher_data.teacher_id).first()
    if existing_teacher:
        raise HTTPException(status_code=400, detail="Teacher ID already exists")

    new_teacher = models.Teacher(
        teacher_id=teacher_data.teacher_id,
        name=teacher_data.name,
        subject=teacher_data.subject,
        avg_improvement=teacher_data.avg_improvement,
        feedback_score=teacher_data.feedback_score,
        content_quality_score=teacher_data.content_quality_score,
        placement_conversion=teacher_data.placement_conversion
    )
    db.add(new_teacher)
    
    # Automatically create a User account for the teacher
    # Default Email: teacher.[id]@school.com (or just ask them to login with it)
    # Let's use a standard format: [teacher_id]@school.com ? Or just keep it simple.
    # The user request didn't specify, but for consistency with students:
    teacher_email = f"{teacher_data.teacher_id}@school.com".lower() 
    # Or maybe use the name? IDs are safer.
    
    existing_user = db.query(models.User).filter(models.User.email == teacher_email).first()
    if not existing_user:
        hashed_password = auth.get_password_hash(teacher_data.teacher_id) # Password is ID
        new_user = models.User(
            email=teacher_email,
            password_hash=hashed_password,
            role=models.UserRole.teacher,
            linked_id=teacher_data.teacher_id
        )
        db.add(new_user)
        
    db.commit()
    db.refresh(new_teacher)
    
    return {"message": "Teacher created successfully", "teacher": new_teacher, "credentials": {"email": teacher_email, "password": teacher_data.teacher_id}}

@router.post("/students/bulk")
def bulk_update_students(
    updates: List[schemas.StudentBulkUpdateItem],
    db: Session = Depends(database.get_db),
    user: models.User = Depends(admin_or_teacher)
):
    count = 0
    # Pre-fetch assigned batches for teacher
    batch_list = []
    if user.role == models.UserRole.teacher:
        teacher_id = user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]

    for update_item in updates:
        student = db.query(models.Student).filter(models.Student.student_id == update_item.student_id).first()
        if student:
            # Check permission
            if user.role == models.UserRole.teacher and student.batch_id not in batch_list:
                continue # Skip students not in teacher's batches
                
            if update_item.attendance is not None: student.attendance = update_item.attendance
            if update_item.dsa_score is not None: student.dsa_score = update_item.dsa_score
            if update_item.ml_score is not None: student.ml_score = update_item.ml_score
            if update_item.qa_score is not None: student.qa_score = update_item.qa_score
            if update_item.projects_score is not None: student.projects_score = update_item.projects_score
            if update_item.mock_interview_score is not None: student.mock_interview_score = update_item.mock_interview_score
            if update_item.fees_paid is not None: student.fees_paid = update_item.fees_paid
            if update_item.external_certifications is not None: student.external_certifications = update_item.external_certifications
            count += 1
    
    db.commit()
    return {"message": f"Successfully updated {count} students"}

@router.post("/teachers/bulk")
def bulk_update_teachers(
    updates: List[schemas.TeacherBulkUpdateItem],
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(admin_or_teacher)
):
    count = 0
    for update_item in updates:
        teacher = db.query(models.Teacher).filter(models.Teacher.teacher_id == update_item.teacher_id).first()
        if teacher:
            if update_item.avg_improvement is not None: teacher.avg_improvement = update_item.avg_improvement
            if update_item.feedback_score is not None: teacher.feedback_score = update_item.feedback_score
            if update_item.content_quality_score is not None: teacher.content_quality_score = update_item.content_quality_score
            if update_item.placement_conversion is not None: teacher.placement_conversion = update_item.placement_conversion
            count += 1
            
    db.commit()
    return {"message": f"Successfully updated {count} teachers"}

@router.put("/user/approve/{email}")
def approve_user(
    email: str,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(auth.get_current_active_admin)
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.approved = True
    user.approved_by = admin.user_id
    user.approved_at = func.now()
    db.commit()
    return {"message": f"User {email} approved successfully"}

@router.get("/list/teachers")
def list_teachers(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(admin_or_teacher)
):
    return db.query(models.Teacher).all()
