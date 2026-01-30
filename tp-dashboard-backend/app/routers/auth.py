from fastapi import APIRouter, Form, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    redirect_url: str

@router.post("/login", response_model=LoginResponse)
async def login(username: str = Form(...), password: str = Form(...)):
    # Simple hardcoded auth for demo/MVP
    # In a real app, verify against DB (e.g. users table or dataset)
    
    user = username.lower().strip()
    
    if user == "admin@example.com" or "admin" in user:
        return {
            "access_token": "fake-admin-token",
            "token_type": "bearer",
            "role": "admin",
            "redirect_url": "/admin/dashboard"
        }
    elif "teacher" in user:
        return {
            "access_token": "fake-teacher-token",
            "token_type": "bearer",
            "role": "teacher",
            "redirect_url": "/teacher/dashboard"
        }
    # Allow student login (default)
    else:
         return {
            "access_token": f"fake-student-token-{user}",
            "token_type": "bearer",
            "role": "student",
            "redirect_url": "/student/dashboard"
        }
