from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student
from pydantic import BaseModel
import random
import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from .. import models, auth

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

# --- RAG Chat Bot Implementation ---

class ChatMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    offline: bool

def get_db_context(db: Session) -> str:
    students = db.query(models.Student).all()
    teachers = db.query(models.Teacher).all()
    
    total_students = len(students)
    if total_students == 0:
        return "The database is currently empty."
        
    avg_attendance = sum(s.attendance for s in students) / total_students
    avg_dsa = sum(s.dsa_score for s in students) / total_students
    avg_ml = sum(s.ml_score for s in students) / total_students
    avg_qa = sum(s.qa_score for s in students) / total_students
    avg_mock = sum(s.mock_interview_score for s in students) / total_students
    
    red_count = sum(1 for s in students if s.rag_status == "Red")
    amber_count = sum(1 for s in students if s.rag_status == "Amber")
    green_count = sum(1 for s in students if s.rag_status == "Green")
    
    # Format a compact list of students
    students_list = []
    for s in students:
        students_list.append({
            "id": s.student_id,
            "name": s.name,
            "batch": s.batch_id,
            "rag": s.rag_status,
            "attendance": s.attendance,
            "dsa": s.dsa_score,
            "ml": s.ml_score,
            "qa": s.qa_score,
            "projects": s.projects_score,
            "mock": s.mock_interview_score,
            "pre": s.pre_score,
            "post": s.post_score
        })
        
    teachers_list = []
    for t in teachers:
        teachers_list.append({
            "name": t.name,
            "subject": t.subject,
            "avg_improvement": t.avg_improvement,
            "feedback": t.feedback_score,
            "conversion": t.placement_conversion
        })
        
    context = {
        "stats": {
            "total_students": total_students,
            "avg_attendance": round(avg_attendance, 1),
            "avg_dsa": round(avg_dsa, 1),
            "avg_ml": round(avg_ml, 1),
            "avg_qa": round(avg_qa, 1),
            "avg_mock": round(avg_mock, 1),
            "rag_distribution": {
                "Red (At Risk)": red_count,
                "Amber (Borderline)": amber_count,
                "Green (On Track)": green_count
            }
        },
        "students": students_list,
        "teachers": teachers_list
    }
    
    return json.dumps(context, indent=2)

def offline_fallback_chat(message: str, db: Session) -> str:
    message_lc = message.lower()
    students = db.query(models.Student).all()
    teachers = db.query(models.Teacher).all()
    
    # 1. Check for specific student names or IDs
    for s in students:
        if s.student_id.lower() in message_lc or s.name.lower() in message_lc:
            return (
                f"### Student Profile: **{s.name}** ({s.student_id})\n"
                f"- **Batch**: {s.batch_id}\n"
                f"- **RAG Status**: {s.rag_status}\n"
                f"- **Attendance**: {s.attendance}%\n"
                f"- **Academic Scores**:\n"
                f"  - DSA: {s.dsa_score}\n"
                f"  - ML: {s.ml_score}\n"
                f"  - QA: {s.qa_score}\n"
                f"  - Projects: {s.projects_score}\n"
                f"  - Mock Interview: {s.mock_interview_score}\n"
                f"- **Observation Improvement**: Pre: {s.pre_score} → Post: {s.post_score}\n"
                f"\n*Note: Running in local offline RAG mode.*"
            )
            
    # 2. Check for risk/at-risk/red
    if any(k in message_lc for k in ["risk", "red", "amber", "fail", "struggle"]):
        red_students = [s for s in students if s.rag_status == "Red"]
        amber_students = [s for s in students if s.rag_status == "Amber"]
        
        response = "### 🚨 Students At Risk Analysis\n\n"
        if red_students:
            response += "#### **High Risk (Red RAG Status)**:\n"
            for s in red_students:
                response += f"- **{s.name}** ({s.student_id}): Attendance {s.attendance}%, DSA {s.dsa_score}, ML {s.ml_score}\n"
        else:
            response += "✅ No students currently marked as High Risk (Red).\n"
            
        if amber_students:
            response += "\n#### **Medium Risk (Amber RAG Status)**:\n"
            for s in amber_students:
                response += f"- **{s.name}** ({s.student_id}): Attendance {s.attendance}%, Mock Interview {s.mock_interview_score}\n"
                
        response += "\n*Recommendation*: Focus on students with attendance below 75% or technical scores below 60%."
        return response
        
    # 3. Check for teacher/faculty
    if any(k in message_lc for k in ["teacher", "faculty", "trainer", "instructor"]):
        response = "### 👨‍🏫 SAGE University Faculty Overview\n\n"
        response += "| Name | Subject | Feedback Rating | Placement Conv. |\n"
        response += "| :--- | :--- | :--- | :--- |\n"
        for t in teachers:
            response += f"| {t.name} | {t.subject} | {t.feedback_score}/5 | {t.placement_conversion}% |\n"
        return response
        
    # 4. Check for stats/summary/average
    if any(k in message_lc for k in ["stats", "summary", "average", "avg", "overview", "count"]):
        total_students = len(students)
        avg_attendance = sum(s.attendance for s in students) / total_students if total_students else 0
        avg_dsa = sum(s.dsa_score for s in students) / total_students if total_students else 0
        avg_ml = sum(s.ml_score for s in students) / total_students if total_students else 0
        avg_qa = sum(s.qa_score for s in students) / total_students if total_students else 0
        
        red_count = sum(1 for s in students if s.rag_status == "Red")
        amber_count = sum(1 for s in students if s.rag_status == "Amber")
        green_count = sum(1 for s in students if s.rag_status == "Green")
        
        return (
            f"### 📊 Student Database Summary\n"
            f"- **Total Enrolled**: {total_students} students\n"
            f"- **RAG Risk Profile**:\n"
            f"  - 🔴 Red (At Risk): {red_count}\n"
            f"  - 🟡 Amber (Borderline): {amber_count}\n"
            f"  - 🟢 Green (On Track): {green_count}\n"
            f"- **Averages Indicators**:\n"
            f"  - Attendance: {avg_attendance:.1f}%\n"
            f"  - DSA: {avg_dsa:.1f}/100\n"
            f"  - Machine Learning: {avg_ml:.1f}/100\n"
            f"  - Quantitative Aptitude: {avg_qa:.1f}/100\n"
        )
        
    return (
        "👋 Hello! I am the SAGE University AI Assistant.\n\n"
        "I can answer questions regarding students, attendance, grades, faculty, or RAG risks. "
        "Here are some examples of what you can ask me:\n"
        "1. *'Who are the students currently at risk?'*\n"
        "2. *'Show me the profile of student S01'* (or search by name)\n"
        "3. *'What is the average attendance and score details?'*\n"
        "4. *'List all teachers and their feedback ratings.'*\n\n"
        "*(Note: Currently running in offline fallback mode. Configure `GEMINI_API_KEY` in `.env` to enable full smart LLM capabilities!)*"
    )

def call_llm_rag(system_instruction: str, user_message: str, history: List[ChatMessage]) -> str:
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if gemini_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        headers = {"Content-Type": "application/json"}
        
        contents = []
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.content}]
            })
            
        contents.append({
            "role": "user",
            "parts": [{"text": f"User query: {user_message}"}]
        })
        
        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            }
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini Chat API error: {e}")
            pass
            
    if openai_key:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_key}"
        }
        
        messages = [{"role": "system", "content": system_instruction}]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_message})
        
        payload = {
            "model": "gpt-4o-mini",
            "messages": messages
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI Chat API error: {e}")
            pass
            
    raise Exception("No LLM API keys configured or succeeded.")

@router.post("/chat", response_model=ChatResponse)
def chat_bot(req: ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    # Authenticated check
    if current_user.role not in [models.UserRole.admin, models.UserRole.teacher]:
        raise HTTPException(status_code=403, detail="Only Admins and Teachers can use the AI Assistant.")
        
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    # Try calling the RAG model if keys are available
    if gemini_key or openai_key:
        try:
            db_context = get_db_context(db)
            system_instruction = (
                "You are SAGE University AI Assistant. You are built to assist admins and teachers. "
                "You have direct RAG access to the students and faculty database. "
                "Below is the current database dump in JSON format. Use this real-time data to answer "
                "user inquiries accurately. Provide clear, professional answers in Markdown format. "
                "Use bold text, lists, and markdown tables where appropriate to present data cleanly.\n\n"
                f"DATABASE STATE:\n{db_context}"
            )
            response_text = call_llm_rag(system_instruction, req.message, req.history)
            return {"response": response_text, "offline": False}
        except Exception as e:
            print(f"RAG LLM execution failed, falling back to offline mode: {e}")
            
    # Run offline mode as fallback
    response_text = offline_fallback_chat(req.message, db)
    return {"response": response_text, "offline": True}
