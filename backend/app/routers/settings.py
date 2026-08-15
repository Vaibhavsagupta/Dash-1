from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database, auth, schemas
from pydantic import BaseModel
from typing import Optional, Dict
import json

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)

class SystemSettings(BaseModel):
    two_factor_auth: bool
    session_timeout: bool
    registration_alerts: bool

@router.get("", response_model=SystemSettings)
def get_settings(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_active_admin)):
    # Helper to get value or default
    def get_val(key, default):
        s = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        return s.value == "true" if s else default

    return SystemSettings(
        two_factor_auth=get_val("two_factor_auth", False),
        session_timeout=get_val("session_timeout", True),
        registration_alerts=get_val("registration_alerts", True)
    )

@router.post("")
def update_settings(settings: SystemSettings, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_active_admin)):
    def set_val(key, val):
        s = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if not s:
            s = models.SystemSetting(key=key, value="true" if val else "false")
            db.add(s)
        else:
            s.value = "true" if val else "false"
    
    set_val("two_factor_auth", settings.two_factor_auth)
    set_val("session_timeout", settings.session_timeout)
    set_val("registration_alerts", settings.registration_alerts)
    
    db.commit()
    return {"message": "Settings updated"}

from fastapi.encoders import jsonable_encoder

@router.get("/export")
def export_database(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_active_admin)):
    data = {}
    
    # Helper to serialize alchemy objects
    def serialize(model):
        objs = db.query(model).all()
        return [
            {c.name: getattr(o, c.name) for c in o.__table__.columns}
            for o in objs
        ]
    
    data['students'] = serialize(models.Student)
    data['teachers'] = serialize(models.Teacher)
    data['attendance_logs'] = serialize(models.AttendanceLog)
    data['assessments'] = serialize(models.Assessment)
    data['rag_logs'] = serialize(models.RAGLog)
    data['lectures'] = serialize(models.Lecture)
    data['assignments'] = serialize(models.Assignment)
    data['submissions'] = serialize(models.Submission)
    data['users'] = serialize(models.User)

    return jsonable_encoder(data)

@router.post("/purge-cache")
def purge_cache(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_active_admin)):
    # Simulating cache purge
    return {"message": "System cache purged successfully"}


# ─── Ranking Configuration ─────────────────────────────────────────────────────

DEFAULT_RANKING_CONFIG = {
    "dsa":        {"enabled": True, "weight": 20.0, "label": "DSA"},
    "ml":         {"enabled": True, "weight": 20.0, "label": "Machine Learning"},
    "qa":         {"enabled": True, "weight": 20.0, "label": "Quantitative Aptitude"},
    "projects":   {"enabled": True, "weight": 20.0, "label": "Projects"},
    "mock":       {"enabled": True, "weight": 10.0, "label": "Mock Interview"},
    "attendance": {"enabled": True, "weight": 10.0, "label": "Attendance"},
}


class RankingParamConfig(BaseModel):
    enabled: bool
    weight: float
    label: str


class RankingConfigPayload(BaseModel):
    config: Dict[str, RankingParamConfig]


@router.get("/ranking-config")
def get_ranking_config(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "ranking_config").first()
    if setting:
        return json.loads(setting.value)
    return DEFAULT_RANKING_CONFIG


@router.post("/ranking-config")
def update_ranking_config(
    payload: RankingConfigPayload,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    # Validate total weight of enabled parameters
    total = sum(p.weight for p in payload.config.values() if p.enabled)
    if abs(total - 100.0) > 0.5:
        raise HTTPException(
            status_code=400,
            detail=f"Total weight of enabled parameters must equal 100%. Current total: {round(total, 1)}%"
        )

    value = json.dumps({k: v.dict() for k, v in payload.config.items()})
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "ranking_config").first()
    if setting:
        setting.value = value
    else:
        setting = models.SystemSetting(key="ranking_config", value=value)
        db.add(setting)
    db.commit()
    return {"message": "Ranking configuration saved successfully"}

# ─── Risk Weights Configuration ───────────────────────────────────────────────

DEFAULT_RISK_WEIGHTS = {
    "academic": {"label": "Academic Marks", "weight": 25.0, "icon": "🎓"},
    "attendance": {"label": "Attendance Score", "weight": 20.0, "icon": "📅"},
    "engagement": {"label": "Platform Engagement", "weight": 15.0, "icon": "💻"},
    "assessment_trend": {"label": "30-Day Assessment Trend", "weight": 15.0, "icon": "📈"},
    "assignment": {"label": "Assignment & Test Submission", "weight": 20.0, "icon": "📝"},
    "backlog": {"label": "Active Backlogs", "weight": 5.0, "icon": "⚠️"}
}

class RiskWeightParam(BaseModel):
    label: str
    weight: float
    icon: str

class RiskWeightsPayload(BaseModel):
    config: Dict[str, RiskWeightParam]

@router.get("/risk-weights")
def get_risk_weights(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "risk_weights").first()
    if setting:
        return json.loads(setting.value)
    return DEFAULT_RISK_WEIGHTS

@router.post("/risk-weights")
def update_risk_weights(
    payload: RiskWeightsPayload,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    total = sum(p.weight for p in payload.config.values())
    if abs(total - 100.0) > 0.5:
        raise HTTPException(
            status_code=400,
            detail=f"Total weight of risk parameters must equal 100%. Current total: {round(total, 1)}%"
        )

    value = json.dumps({k: v.dict() for k, v in payload.config.items()})
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "risk_weights").first()
    if setting:
        setting.value = value
    else:
        setting = models.SystemSetting(key="risk_weights", value=value)
        db.add(setting)
    db.commit()
    return {"message": "Risk weight configuration saved successfully"}

# -------------------------------------------------------------------
# AI CHATBOT PREDEFINED QUESTIONS MANAGEMENT
# -------------------------------------------------------------------
DEFAULT_PREDEFINED_QUESTIONS = [
    {"id": "def_1", "question_text": "Who is currently at risk?", "category": "Risk", "is_default": True},
    {"id": "def_2", "question_text": "Average class metrics details?", "category": "Analytics", "is_default": True},
    {"id": "def_3", "question_text": "Profile of student S01", "category": "Student", "is_default": True},
    {"id": "def_4", "question_text": "List all teacher feedback scores", "category": "Faculty", "is_default": True},
    {"id": "def_5", "question_text": "Show attendance deficit students (<75%)", "category": "Attendance", "is_default": True},
    {"id": "def_6", "question_text": "Top performing students in Machine Learning", "category": "Academics", "is_default": True},
    {"id": "def_7", "question_text": "Show placement readiness conversion rates", "category": "Placement", "is_default": True},
    {"id": "def_8", "question_text": "List all active marks parameters", "category": "Config", "is_default": True}
]

@router.get("/predefined-questions")
def get_predefined_questions(
    db: Session = Depends(database.get_db)
):
    db_questions = db.query(models.PredefinedQuestion).order_by(models.PredefinedQuestion.created_at.desc()).all()
    
    result = list(DEFAULT_PREDEFINED_QUESTIONS)
    for q in db_questions:
        result.append({
            "id": q.id,
            "question_text": q.question_text,
            "category": q.category or "General",
            "is_default": False
        })
    return result

@router.post("/predefined-questions")
def create_predefined_question(
    q_in: schemas.PredefinedQuestionCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    if not q_in.question_text.strip():
        raise HTTPException(status_code=400, detail="Question text cannot be empty")
        
    existing = db.query(models.PredefinedQuestion).filter(models.PredefinedQuestion.question_text.ilike(q_in.question_text.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Question already exists in predefined list")

    db_q = models.PredefinedQuestion(
        question_text=q_in.question_text.strip(),
        category=q_in.category or "General"
    )
    db.add(db_q)
    db.commit()
    db.refresh(db_q)
    return {"message": "Predefined question added successfully", "question": {"id": db_q.id, "question_text": db_q.question_text, "category": db_q.category}}

@router.delete("/predefined-questions/{question_id}")
def delete_predefined_question(
    question_id: str,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(auth.get_current_active_admin)
):
    q = db.query(models.PredefinedQuestion).filter(models.PredefinedQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(q)
    db.commit()
    return {"message": "Predefined question deleted successfully"}
