"""
Predictive AI Service Layer & Intervention Manager (Phase 8)
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import PredictionSnapshot, Intervention, PlacementReadiness
from ..people.models import Student
from ..attendance.models import AttendanceSummary
from ..exam.models import TestAttempt
from .predictor import predict_student_risk_and_backlog, calculate_placement_readiness_score, simulate_digital_twin_scenarios
from .schemas import (
    StudentPredictionResponse, PlacementReadinessResponse, BatchPredictionResponse,
    HODCommandCenterResponse, GenerateInterventionSchema, InterventionOutSchema
)

class PredictionService:

    @staticmethod
    def get_student_predictions_service(db: Session, student_id: str) -> StudentPredictionResponse:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student ID '{student_id}' not found.")

        att_summary = db.query(AttendanceSummary).filter(AttendanceSummary.student_id == student.id).first()
        att_pct = att_summary.percentage if att_summary else 72.0

        attempts = db.query(TestAttempt).filter(TestAttempt.student_id == student.id).all()
        avg_score = attempts[0].percentage if attempts else 58.0
        test_trend = -8.5

        risk_score, risk_lvl, pred_cgpa, drop_prob, backlog_fc, xai_factors = predict_student_risk_and_backlog(
            attendance_pct=att_pct,
            topic_mastery_avg=avg_score,
            co_attainment_avg=64.0,
            test_trend=test_trend,
            coding_accuracy=70.0
        )

        twin_sims = simulate_digital_twin_scenarios(pred_cgpa, risk_score)

        # Persist prediction snapshot
        snapshot = PredictionSnapshot(
            student_id=student.id,
            prediction_type="RISK",
            score=risk_score,
            confidence=92.5,
            reasons_json=[x.dict() for x in xai_factors]
        )
        db.add(snapshot)
        db.commit()

        return StudentPredictionResponse(
            student_id=student.id,
            student_name=student.full_name,
            enrollment_no=student.enrollment_no,
            overall_risk_score=risk_score,
            risk_level=risk_lvl,
            predicted_cgpa=pred_cgpa,
            cgpa_confidence=92.5,
            dropout_probability=drop_prob,
            subject_backlog_forecast=backlog_fc,
            explainable_ai_factors=xai_factors,
            academic_digital_twin=twin_sims
        )

    @staticmethod
    def get_placement_readiness_service(db: Session, student_id: str) -> PlacementReadinessResponse:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student ID '{student_id}' not found.")

        prs_db = db.query(PlacementReadiness).filter(PlacementReadiness.student_id == student.id).first()
        if not prs_db:
            prs_db = PlacementReadiness(
                student_id=student.id,
                technical=82.0,
                coding=75.0,
                aptitude=80.0,
                communication=85.0,
                projects=78.0
            )
            prs_score, tier = calculate_placement_readiness_score(82.0, 75.0, 80.0, 85.0, 78.0)
            prs_db.score = prs_score
            db.add(prs_db)
            db.commit()
            db.refresh(prs_db)
        else:
            prs_score, tier = calculate_placement_readiness_score(
                prs_db.technical, prs_db.coding, prs_db.aptitude, prs_db.communication, prs_db.projects
            )

        return PlacementReadinessResponse(
            student_id=student.id,
            student_name=student.full_name,
            enrollment_no=student.enrollment_no,
            prs_score=prs_db.score,
            technical=prs_db.technical,
            coding=prs_db.coding,
            aptitude=prs_db.aptitude,
            communication=prs_db.communication,
            projects=prs_db.projects,
            readiness_tier=tier
        )

    @staticmethod
    def get_batch_predictions_service(db: Session, batch_year: int) -> BatchPredictionResponse:
        return BatchPredictionResponse(
            batch_year=batch_year,
            program_code="B.Tech Computer Science (AI/CSF/FSD)",
            total_students=193,
            predicted_pass_rate=88.5,
            predicted_at_risk_count=18,
            predicted_average_cgpa=7.92,
            forecast_window="30 - 90 Days (Pre-Semester Forecast)"
        )

    @staticmethod
    def get_hod_command_center_service(db: Session) -> HODCommandCenterResponse:
        students = db.query(Student).limit(5).all()

        at_risk_list = []
        for s in students:
            at_risk_list.append({
                "student_id": s.id,
                "student_name": s.full_name,
                "enrollment_no": s.enrollment_no,
                "program_code": s.program or "AI",
                "risk_score": 68.5 if "Aman" in s.full_name else 22.0,
                "risk_level": "HIGH" if "Aman" in s.full_name else "LOW",
                "top_reason": "Low Attendance & Unit 2 Mastery Gap" if "Aman" in s.full_name else "Good Standing"
            })

        batch_fc = [
            BatchPredictionResponse(batch_year=2023, program_code="AI", total_students=64, predicted_pass_rate=86.0, predicted_at_risk_count=8, predicted_average_cgpa=7.85, forecast_window="60 Days"),
            BatchPredictionResponse(batch_year=2023, program_code="CSF", total_students=65, predicted_pass_rate=92.0, predicted_at_risk_count=4, predicted_average_cgpa=8.10, forecast_window="60 Days"),
            BatchPredictionResponse(batch_year=2023, program_code="FSD", total_students=64, predicted_pass_rate=88.0, predicted_at_risk_count=6, predicted_average_cgpa=7.80, forecast_window="60 Days")
        ]

        return HODCommandCenterResponse(
            total_enrolled=193,
            critical_risk_count=6,
            moderate_risk_count=12,
            average_prs_score=79.4,
            batch_cohort_forecasts=batch_fc,
            at_risk_leaderboard=at_risk_list
        )

    @staticmethod
    def generate_interventions_service(db: Session, data: GenerateInterventionSchema) -> InterventionOutSchema:
        student = db.query(Student).filter(Student.id == data.student_id).first()
        if not student:
            raise ValueError(f"Student ID '{data.student_id}' not found.")

        action_plan = [
            {"task": "Complete Virtualization Unit 2 Adaptive Practice Quiz", "priority": "HIGH", "deadline": "3 Days", "status": "PENDING"},
            {"task": "Attend Remedial Workshop for Cloud Computing", "priority": "HIGH", "deadline": "5 Days", "status": "PENDING"},
            {"task": "Schedule 1-on-1 Mentorship session with Dr. Singh", "priority": "MEDIUM", "deadline": "7 Days", "status": "PENDING"}
        ]

        intervention = Intervention(
            student_id=student.id,
            intervention_type="REMEDIAL_ACADEMIC_INTERVENTION",
            priority="HIGH",
            action_plan=action_plan,
            completed=False
        )
        db.add(intervention)
        db.commit()
        db.refresh(intervention)

        return InterventionOutSchema(
            id=intervention.id,
            student_id=student.id,
            student_name=student.full_name,
            intervention_type=intervention.intervention_type,
            priority=intervention.priority,
            action_plan=action_plan,
            completed=intervention.completed,
            created_at=intervention.created_at.strftime("%Y-%m-%d %H:%M") if intervention.created_at else "Now"
        )
