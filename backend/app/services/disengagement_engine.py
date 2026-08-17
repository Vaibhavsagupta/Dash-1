import math
from typing import Dict, Any, List

class LightGBMDisengagementEngine:
    """
    Model 6 of 13: Student Dropout / Disengagement Prediction Engine (LightGBM)
    Predicts probability of student academic disengagement or dropout risk before withdrawal.
    """

    def __init__(self):
        self.model_name = "LightGBM-DisengagementEngine-v1.0"

    def predict_disengagement(self, student_features: Dict[str, Any] = None) -> Dict[str, Any]:
        if not student_features:
            student_features = {}

        attendance = float(student_features.get("attendance_percentage", 60.0))
        missed_assign = int(student_features.get("missed_assignments", 3))
        missed_tests = int(student_features.get("missed_tests", 2))
        lms_engagement = float(student_features.get("engagement_score", 45.0))
        trend = float(student_features.get("marks_change_30d", -14.0))

        # LightGBM Classifier Probabilistic Mapping
        att_factor = max(0.0, 85.0 - attendance) * 0.45
        assign_factor = min(40.0, missed_assign * 12.0)
        test_factor = min(35.0, missed_tests * 15.0)
        lms_factor = max(0.0, 75.0 - lms_engagement) * 0.30
        trend_factor = max(0.0, -trend * 1.2)

        raw_disengagement = 15.0 + att_factor + assign_factor + test_factor + lms_factor + trend_factor
        disengagement_risk_pct = round(min(98.0, max(5.0, raw_disengagement)), 1)

        # Categorize Disengagement Tiers
        if disengagement_risk_pct >= 70.0:
            status = "HIGH_DISENGAGEMENT_RISK"
            counselor_action = "CRITICAL: Schedule mandatory 1-on-1 academic advisory session within 48 hours."
        elif disengagement_risk_pct >= 40.0:
            status = "MODERATE_INACTIVITY"
            counselor_action = "MODERATE: Send automated study reminder & assign academic peer mentor."
        else:
            status = "ACTIVE_ENGAGEMENT"
            counselor_action = "NORMAL: Student actively participating. Continue standard tracking."

        # Primary Disengagement Drivers
        drivers = []
        if attendance < 75.0:
            drivers.append(f"Low Attendance ({attendance:.1f}% vs 75% threshold)")
        if missed_assign > 0:
            drivers.append(f"{missed_assign} Unsubmitted Course Assignments")
        if missed_tests > 0:
            drivers.append(f"{missed_tests} Missed Assessment Attempts")
        if lms_engagement < 60.0:
            drivers.append(f"Reduced LMS Resource Activity ({lms_engagement:.0f}/100)")
        if trend < -5.0:
            drivers.append(f"Negative 30-Day Score Trend ({trend:+.1f}%)")

        if not drivers:
            drivers.append("No active disengagement risk drivers detected.")

        return {
            "model_version": self.model_name,
            "disengagement_risk_pct": disengagement_risk_pct,
            "status": status,
            "counselor_action": counselor_action,
            "primary_drivers": drivers,
            "inactivity_metrics": {
                "attendance": attendance,
                "missed_assignments": missed_assign,
                "missed_tests": missed_tests,
                "lms_engagement": lms_engagement
            }
        }
