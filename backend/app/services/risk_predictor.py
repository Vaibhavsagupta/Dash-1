from abc import ABC, abstractmethod
from typing import Dict, Any

class RiskPredictor(ABC):

    @abstractmethod
    def predict_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        pass

class RuleBasedRiskPredictor(RiskPredictor):

    def predict_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if not features.get("has_sufficient_data", True):
            return {
                "overall_risk": 50.0,
                "risk_level": "MODERATE",
                "risk_status": "INSUFFICIENT_DATA",
                "academic_risk": 50.0,
                "attendance_risk": 50.0,
                "engagement_risk": 50.0,
                "assessment_risk": 50.0,
                "backlog_risk": 50.0,
                "model_version": "rule-based-v1.0"
            }

        current_avg_marks = features.get("current_average_marks", 70.0)
        attendance_pct = features.get("attendance_percentage", 75.0)
        eng_score = features.get("engagement_score", 70.0)
        assessment_avg = features.get("assessment_average", 75.0)
        backlog_count = features.get("backlog_count", 0)

        # 1. Academic Risk (25%) -> 100 - avg_marks
        academic_risk = max(0.0, min(100.0, 100.0 - current_avg_marks))

        # 2. Attendance Risk (20%) -> 100 - attendance_pct
        attendance_risk = max(0.0, min(100.0, 100.0 - attendance_pct))

        # 3. Engagement Risk (15%) -> 100 - eng_score
        engagement_risk = max(0.0, min(100.0, 100.0 - eng_score))

        # 4. Assessment Trend Risk (15%)
        marks_change = features.get("marks_change_30d", 0.0)
        assessment_risk = max(0.0, min(100.0, (100.0 - assessment_avg) + max(0.0, -marks_change * 2.0)))

        # 5. Assignment Behaviour (10%)
        missed_assignments = features.get("missed_assignments", 0)
        assignment_risk = min(100.0, missed_assignments * 20.0)

        # 6. Test Performance (10%)
        missed_tests = features.get("missed_tests", 0)
        test_risk = min(100.0, missed_tests * 25.0)

        # 7. Backlog Risk (5%)
        backlog_risk = min(100.0, backlog_count * 30.0)

        # Dynamic AI evaluation of built-in + admin custom added risk factors
        weights = features.get("weights", {})
        if not weights:
            weights = {
                "academic": {"weight": 25.0},
                "attendance": {"weight": 20.0},
                "engagement": {"weight": 15.0},
                "assessment_trend": {"weight": 15.0},
                "assignment": {"weight": 20.0},
                "backlog": {"weight": 5.0}
            }

        total_risk = 0.0
        total_weight = 0.0

        for key, cfg in weights.items():
            w = (cfg.get("weight", 0.0) if isinstance(cfg, dict) else float(cfg)) / 100.0
            if w <= 0:
                continue

            if key == "academic":
                f_risk = academic_risk
            elif key == "attendance":
                f_risk = attendance_risk
            elif key == "engagement":
                f_risk = engagement_risk
            elif key == "assessment_trend":
                f_risk = assessment_risk
            elif key == "assignment":
                f_risk = assignment_risk
            elif key == "backlog":
                f_risk = backlog_risk
            else:
                # Custom AI Factor added dynamically by admin
                custom_val = features.get(key)
                if custom_val is None:
                    custom_val = features.get(f"{key}_score", 70.0)
                f_risk = max(0.0, min(100.0, 100.0 - float(custom_val or 70.0)))

            total_risk += f_risk * w
            total_weight += w

        raw_overall = (total_risk / total_weight * 100.0) if total_weight > 1.5 else total_risk

        overall_risk = round(min(100.0, max(0.0, raw_overall)), 1)

        # 5-Level Classification: 0-20 VERY_LOW, 21-40 LOW, 41-60 MODERATE, 61-80 HIGH, 81-100 CRITICAL
        if overall_risk >= 81.0:
            risk_level = "CRITICAL"
        elif overall_risk >= 61.0:
            risk_level = "HIGH"
        elif overall_risk >= 41.0:
            risk_level = "MODERATE"
        elif overall_risk >= 21.0:
            risk_level = "LOW"
        else:
            risk_level = "VERY_LOW"

        return {
            "overall_risk": overall_risk,
            "risk_level": risk_level,
            "risk_status": "CALCULATED",
            "academic_risk": round(academic_risk, 1),
            "attendance_risk": round(attendance_risk, 1),
            "engagement_risk": round(engagement_risk, 1),
            "assessment_risk": round(assessment_risk, 1),
            "backlog_risk": round(backlog_risk, 1),
            "model_version": "rule-based-v1.0"
        }

class MLRiskPredictor(RiskPredictor):
    """Stub ready for scikit-learn / XGBoost tabular model inference"""
    def __init__(self, model_path: str = None):
        self.model_version = "academic-risk-v1.0"

    def predict_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        # Fallback to rule-based predictor if model artifact is not loaded
        rule_predictor = RuleBasedRiskPredictor()
        res = rule_predictor.predict_risk(features)
        res["model_version"] = self.model_version
        return res
