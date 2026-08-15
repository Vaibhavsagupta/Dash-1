from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
import json

from .. import models

def generate_insights_for_student(student_id: str, db: Session) -> List[Dict[str, Any]]:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | 
        (models.Student.email.like(f"{student_id}%")) |
        (models.Student.student_id == student_id)
    ).first()
    if not student:
        return []

    insights = []

    # 1. AI Analysis of Dynamic Custom Parameters
    param_marks = db.query(models.StudentParameterMark).filter(
        models.StudentParameterMark.student_id == student.enrollment_no
    ).all()

    for pm in param_marks:
        param = db.query(models.MarksParameter).filter(models.MarksParameter.id == pm.parameter_id).first()
        if param:
            percentage = (pm.score / param.max_marks * 100) if param.max_marks > 0 else pm.score
            if percentage < 60:
                insights.append({
                    "id": f"ins_param_{pm.id}",
                    "target_type": "PARAMETER",
                    "target_id": param.id,
                    "title": f"Low Performance in {param.parameter_name}",
                    "insight_text": f"Scored {pm.score}/{param.max_marks} ({round(percentage, 1)}%) in {param.parameter_name} ({param.subject}). AI recommends targeted review.",
                    "impact_level": "HIGH" if percentage < 45 else "MEDIUM",
                    "created_at": datetime.utcnow().isoformat()
                })
            elif percentage >= 85:
                insights.append({
                    "id": f"ins_param_{pm.id}",
                    "target_type": "PARAMETER",
                    "target_id": param.id,
                    "title": f"Excellence in {param.parameter_name}",
                    "insight_text": f"Outstanding score of {pm.score}/{param.max_marks} ({round(percentage, 1)}%) in {param.parameter_name}.",
                    "impact_level": "LOW",
                    "created_at": datetime.utcnow().isoformat()
                })

    # 2. Check weak concepts
    weak_concepts = db.query(models.StudentConceptMastery).filter(
        models.StudentConceptMastery.student_id == student.enrollment_no,
        models.StudentConceptMastery.mastery_level.in_(["WEAK", "CRITICAL"])
    ).all()

    if weak_concepts:
        for wc in weak_concepts:
            concept_obj = db.query(models.Concept).filter(models.Concept.id == wc.concept_id).first()
            c_name = concept_obj.concept_name if concept_obj else "Topic"
            ins = {
                "id": f"ins_{wc.id}",
                "target_type": "CONCEPT",
                "target_id": wc.concept_id,
                "title": f"Weak Concept: {c_name}",
                "insight_text": f"{c_name} has {wc.mastery_score}% mastery and is your primary weak area. Easy accuracy: {wc.easy_accuracy}%, Hard accuracy: {wc.hard_accuracy}%.",
                "impact_level": "HIGH",
                "created_at": datetime.utcnow().isoformat()
            }
            insights.append(ins)

    if not insights:
        insights.append({
            "id": "ins_default_01",
            "target_type": "STUDENT",
            "target_id": student.enrollment_no,
            "title": "Good Academic Momentum",
            "insight_text": "You are performing consistently well across all subjects with no active concept gaps or parameter risks detected.",
            "impact_level": "LOW",
            "created_at": datetime.utcnow().isoformat()
        })

    return insights

def generate_remedial_test_config(student_id: str, concept_id: str, db: Session) -> Dict[str, Any]:
    student = db.query(models.Student).filter(
        (models.Student.enrollment_no == student_id) | (models.Student.email.like(f"{student_id}%"))
    ).first()
    if not student:
        return {"error": "Student not found"}

    concept = db.query(models.Concept).filter(models.Concept.id == concept_id).first()
    c_name = concept.concept_name if concept else "Concept Practice"

    config = {
        "concept_id": concept_id,
        "concept_name": c_name,
        "easy_count": 10,
        "medium_count": 10,
        "hard_count": 5,
        "total_questions": 25,
        "estimated_duration_minutes": 30,
        "target_student": student.enrollment_no
    }

    rec = models.RemedialRecommendation(
        student_id=student.enrollment_no,
        concept_id=concept_id,
        recommended_test_config_json=json.dumps(config),
        status="PENDING"
    )
    db.add(rec)
    db.commit()

    return config
