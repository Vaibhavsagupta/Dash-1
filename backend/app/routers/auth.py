from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    verify_result = auth.verify_password(form_data.password, user.password_hash)
    
    if not verify_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval"
        )
    
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    
    # Determine redirect URL based on role
    redirect_url = "/"
    if user.role == models.UserRole.admin:
        redirect_url = "/admin/dashboard"
    elif user.role == models.UserRole.teacher:
        redirect_url = "/teacher/dashboard"
    elif user.role == models.UserRole.student:
        redirect_url = "/student/dashboard"

    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value, "redirect_url": redirect_url}

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    print(f"Registering user: {user.email}, role: {user.role}")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        print(f"User already exists: {user.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        linked_id=user.linked_id,
        approved=False # Explicitly set to False for Phase 2
    )
    print(f"Creating new user in DB: {user.email}")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"User registered successfully: {new_user.user_id}")
    return new_user

@router.post("/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(database.get_db)):
    import random
    from datetime import datetime, timedelta
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    user.otp = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    # In a real app, you'd call an email service here.
    # For now, we'll just return it or log it if in dev.
    print(f"OTP for {request.email}: {otp}")
    
    return {"message": "OTP sent successfully"}

@router.post("/verify-otp")
def verify_otp(request: schemas.OTPVerify, db: Session = Depends(database.get_db)):
    from datetime import datetime
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if user.otp_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    user.is_verified = True
    user.otp = None # Clear OTP after verification
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.get("/user-status")
def get_user_status(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Create user if not exists (for Google OAuth flow)
        # In a real app, you might handle this in the register flow
        return {"is_verified": False, "exists": False}
    return {"is_verified": user.is_verified, "exists": True}
