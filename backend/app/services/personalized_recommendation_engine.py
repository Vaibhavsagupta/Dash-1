import math
from typing import Dict, Any, List

class ContentBasedRecommender:
    """
    Model 8 of 13: Personalized Learning Recommendation Engine (Content-Based + DKT)
    Prescribes tailored 4-step remediation pathways based on Deep Knowledge Tracing weak topic outputs.
    """

    def __init__(self):
        self.model_name = "ContentBased-Recommender-v1.0"

    def generate_recommendations(self, weak_topics: List[str] = None, student_features: Dict[str, Any] = None) -> Dict[str, Any]:
        if not weak_topics:
            weak_topics = ["Arrays", "OOP"]

        target_topic = weak_topics[0] if weak_topics else "Arrays"
        second_topic = weak_topics[1] if len(weak_topics) > 1 else "OOP"

        base_score = float((student_features or {}).get("current_average_marks", 65.0))

        if base_score < 50.0:
            difficulty = "EASY"
            est_gain = 22.5
        elif base_score < 70.0:
            difficulty = "MEDIUM"
            est_gain = 18.0
        else:
            difficulty = "ADVANCED"
            est_gain = 14.0

        pathway = [
            {
                "step": 1,
                "title": f"{target_topic} Core Concept Revision Module",
                "type": "REVISION_READING",
                "estimated_minutes": 20,
                "description": f"Comprehensive review of core {target_topic} theory, diagrams, and common pitfalls."
            },
            {
                "step": 2,
                "title": f"{target_topic} Practice Problem Set ({difficulty} Level)",
                "type": "PRACTICE_SET",
                "question_count": 15,
                "description": f"15 curated practice questions designed for {difficulty.lower()} mastery tier."
            },
            {
                "step": 3,
                "title": f"Adaptive Diagnostic MCQ Assessment — {target_topic}",
                "type": "SPEED_QUIZ",
                "question_count": 10,
                "description": "Real-time accuracy & time per question diagnostic evaluation."
            },
            {
                "step": 4,
                "title": f"Follow-Up Progress Track: {target_topic} & {second_topic}",
                "type": "PROGRESS_EVALUATION",
                "target_mastery": f"{min(95.0, base_score + est_gain):.0f}%",
                "description": "Post-remediation assessment to confirm permanent concept retention."
            }
        ]

        return {
            "model_version": self.model_name,
            "target_topic": target_topic,
            "secondary_topic": second_topic,
            "recommended_difficulty": difficulty,
            "estimated_mastery_gain": f"+{est_gain:.1f}%",
            "total_estimated_time_min": 50,
            "personalized_pathway": pathway
        }
