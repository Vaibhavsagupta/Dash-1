from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import database, models, schemas, auth
from datetime import datetime

router = APIRouter(
    prefix="/admin",
    tags=["admin_workflow"]
)

@router.get("/pending-approvals", response_model=list[schemas.UserResponse])
def get_pending_approvals(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    """List all users pending approval"""
    return db.query(models.User).filter(models.User.approved == False).all()

@router.post("/approve-user")
def approve_user(
    request: schemas.UserApprovalRequest,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    """Approve or Deny a user account"""
    user = db.query(models.User).filter(models.User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.approve:
        user.approved = True
        user.approved_by = current_admin.user_id
        user.approved_at = datetime.utcnow()
        
        # If it's an admin, we also update the 'admins' table
        if user.role == models.UserRole.admin:
            admin_entry = db.query(models.Admin).filter(models.Admin.email == user.email).first()
            if admin_entry:
                admin_entry.approved = True
                admin_entry.approved_by = current_admin.user_id
                admin_entry.approved_at = datetime.utcnow()
    else:
        # If denied, we could delete or mark as rejected. For now, let's keep it simple.
        db.delete(user)
        
    db.commit()
    return {"message": f"User {user.email} {'approved' if request.approve else 'denied'}"}
