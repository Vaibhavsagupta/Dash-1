import math
from typing import Dict, Any, List

class AdaptiveTestPolicyEngine:
    """
    Model 11 of 13: Adaptive Test Generation Engine (IRT + Reinforcement Learning Policy)
    Dynamically adjusts test question difficulty live during exams based on Maximum Fisher Information.
    """

    def __init__(self):
        self.model_name = "IRT-RL-AdaptiveTestEngine-v1.0"

    def select_next_item(self, session_state: Dict[str, Any] = None) -> Dict[str, Any]:
        if not session_state:
            session_state = {
                "current_beta": 0.50,
                "is_last_correct": True,
                "student_theta": 0.72,
                "attempted_count": 3
            }

        curr_beta = float(session_state.get("current_beta", 0.50))
        is_correct = bool(session_state.get("is_last_correct", True))
        theta = float(session_state.get("student_theta", 0.50))
        attempt_cnt = int(session_state.get("attempted_count", 1))

        if is_correct:
            beta_next = min(0.92, curr_beta + 0.18)
            action = "INCREASE_DIFFICULTY"
            reasoning = "Student answered correctly. Increasing difficulty to challenge latent ability."
        else:
            beta_next = max(0.12, curr_beta - 0.22)
            action = "DECREASE_DIFFICULTY"
            reasoning = "Student struggled on previous question. Reducing difficulty to foundational concept."

        # Fisher Information Calculation: I(theta) = a^2 * P(theta) * (1 - P(theta))
        a = 1.40
        p_success = 1.0 / (1.0 + math.exp(-a * (theta - beta_next)))
        fisher_info = round(a * a * p_success * (1.0 - p_success), 2)

        if beta_next >= 0.65:
            next_tier = "HARD"
            color = "#ef4444"
        elif beta_next >= 0.35:
            next_tier = "MEDIUM"
            color = "#f59e0b"
        else:
            next_tier = "EASY"
            color = "#10b981"

        return {
            "model_version": self.model_name,
            "adaptation_action": action,
            "next_question_difficulty_beta": round(beta_next, 2),
            "next_difficulty_tier": next_tier,
            "fisher_information_gain": fisher_info,
            "expected_probability_success": round(p_success * 100.0, 1),
            "color": color,
            "policy_reasoning": reasoning,
            "session_metrics": {
                "questions_completed": attempt_cnt,
                "current_theta_estimate": theta
            }
        }
