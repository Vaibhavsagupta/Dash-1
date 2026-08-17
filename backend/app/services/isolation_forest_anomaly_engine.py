import math
from typing import Dict, Any, List

class IsolationForestAnomalyEngine:
    """
    Model 5 of 13: Behavioral Anomaly Detection Engine (Isolation Forest)
    Flags unusual student test behavior, completion duration anomalies, and sudden performance drops.
    """

    def __init__(self):
        self.model_name = "IsolationForest-AnomalyEngine-v1.0"

    def detect_anomalies(self, test_attempt: Dict[str, Any] = None, student_features: Dict[str, Any] = None) -> Dict[str, Any]:
        if not test_attempt:
            # Demonstration mock attempt
            test_attempt = {
                "test_name": "DBMS Mid-Term Assessment",
                "score": 28.0,
                "previous_average": 78.0,
                "time_taken_min": 3.2,
                "expected_time_min": 25.0
            }

        score = float(test_attempt.get("score", 70.0))
        prev_avg = float(test_attempt.get("previous_average", 75.0))
        time_taken = float(test_attempt.get("time_taken_min", 15.0))
        expected_time = float(test_attempt.get("expected_time_min", 20.0))

        score_drop = prev_avg - score
        time_ratio = time_taken / (expected_time if expected_time > 0 else 20.0)

        anomalies_detected = []
        is_anomaly = False
        anomaly_score = 0.65  # Normal positive baseline

        # 1. Sudden Score Drop Anomaly
        if score_drop >= 25.0:
            is_anomaly = True
            anomaly_score = -0.78
            anomalies_detected.append({
                "type": "SUDDEN_SCORE_DROP",
                "severity": "CRITICAL" if score_drop >= 40.0 else "WARNING",
                "message": f"Unusual performance collapse: Score dropped by {score_drop:.1f}% (Previous Avg: {prev_avg:.1f}%, Current: {score:.1f}%)."
            })

        # 2. Rapid Completion Time Anomaly (Completed in under 20% expected time)
        if time_ratio <= 0.20 and score < 80.0:
            is_anomaly = True
            anomaly_score = min(anomaly_score, -0.85)
            anomalies_detected.append({
                "type": "RAPID_COMPLETION_ANOMALY",
                "severity": "CRITICAL",
                "message": f"Suspicious attempt speed: Completed 25-minute assessment in {time_taken:.1f} minutes ({time_ratio*100:.0f}% of expected time)."
            })

        # 3. Excessive Time Anomaly
        elif time_ratio >= 3.0:
            is_anomaly = True
            anomaly_score = min(anomaly_score, -0.45)
            anomalies_detected.append({
                "type": "EXCESSIVE_DURATION",
                "severity": "MODERATE",
                "message": f"Extended test attempt duration ({time_taken:.1f} min vs {expected_time:.1f} min benchmark)."
            })

        if not is_anomaly:
            anomalies_detected.append({
                "type": "NORMAL_BEHAVIOR",
                "severity": "NORMAL",
                "message": "Student evaluation metrics align with expected behavioral patterns."
            })

        overall_severity = "CRITICAL" if any(a["severity"] == "CRITICAL" for a in anomalies_detected) else \
                           "WARNING" if any(a["severity"] == "WARNING" for a in anomalies_detected) else "NORMAL"

        return {
            "model_version": self.model_name,
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "severity": overall_severity,
            "anomalies_count": len([a for a in anomalies_detected if a["type"] != "NORMAL_BEHAVIOR"]),
            "detected_anomalies": anomalies_detected,
            "attempt_details": {
                "test_name": test_attempt.get("test_name", "Recent Assessment"),
                "score": score,
                "previous_average": prev_avg,
                "time_taken_min": time_taken,
                "expected_time_min": expected_time
            }
        }
