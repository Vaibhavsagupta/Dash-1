"""
Academic DNA Computation Engine, Topic Mastery & CO Attainment Algorithms (Phase 7)
"""

from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from ..people.models import Student, Faculty
from ..curriculum.models import Course
from ..syllabus.models import CourseTopic, CourseOutcome
from ..attendance.models import AttendanceRecord, AttendanceSummary
from ..exam.models import TestAttempt, StudentAnswer
from .schemas import AcademicDNAPayload

def calculate_topic_mastery_score(
    test_accuracy: float,
    attendance_pct: float,
    revision_count: int,
    recent_trend_score: float
) -> Tuple[float, float]:
    """
    Topic Mastery Calculation Engine.
    Formula: Mastery = (Test * 0.50) + (Attendance * 0.20) + (Revision * 0.10) + (RecentTrend * 0.20)
    Returns: (mastery_score, confidence)
    """
    rev_score = min(100.0, revision_count * 25.0)
    mastery = (test_accuracy * 0.50) + (attendance_pct * 0.20) + (rev_score * 0.10) + (recent_trend_score * 0.20)
    mastery = round(min(100.0, max(0.0, mastery)), 1)

    # Confidence grows with number of data points
    confidence = round(min(98.0, 50.0 + (revision_count * 10.0) + (attendance_pct * 0.3)), 1)
    return mastery, confidence

def compute_academic_dna(
    test_attempts: List[TestAttempt],
    attendance_pct: float
) -> AcademicDNAPayload:
    """
    Academic DNA & Knowledge Graph Engine.
    Computes multi-dimensional student learning traits.
    """
    if not test_attempts:
        return AcademicDNAPayload(
            concept_strength=75.0,
            application_skill=70.0,
            analytical_reasoning=65.0,
            consistency=80.0,
            learning_speed=78.0,
            overall_dna_rating="BALANCED_LEARNER"
        )

    scores = [a.percentage for a in test_attempts]
    avg_score = sum(scores) / len(scores)

    # Consistency based on score variance
    variance = sum((s - avg_score) ** 2 for s in scores) / len(scores) if len(scores) > 1 else 10.0
    consistency = round(max(30.0, min(99.0, 100.0 - variance)), 1)

    concept_strength = round(min(99.0, avg_score * 0.95 + 5.0), 1)
    application_skill = round(min(99.0, avg_score * 0.90 + (attendance_pct * 0.10)), 1)
    analytical_reasoning = round(min(99.0, avg_score * 0.85 + 10.0), 1)
    learning_speed = round(min(99.0, 70.0 + (avg_score * 0.25)), 1)

    if avg_score > 85 and consistency > 80:
        rating = "HIGH_ACHIEVER_ANALYTICAL"
    elif application_skill > 80:
        rating = "PRACTICAL_APPLICATION_ORIENTED"
    elif consistency < 60:
        rating = "INCONSISTENT_HIGH_POTENTIAL"
    else:
        rating = "BALANCED_LEARNER"

    return AcademicDNAPayload(
        concept_strength=concept_strength,
        application_skill=application_skill,
        analytical_reasoning=analytical_reasoning,
        consistency=consistency,
        learning_speed=learning_speed,
        overall_dna_rating=rating
    )

def calculate_tei_score(
    topic_completion_pct: float,
    student_improvement_pct: float,
    faculty_attendance_pct: float,
    co_achievement_pct: float,
    student_engagement_pct: float
) -> Tuple[float, str]:
    """
    Teacher Effectiveness Intelligence (TEI) Engine.
    Weights:
    - Topic Completion: 20%
    - Student Improvement: 30%
    - Faculty Attendance: 10%
    - CO Achievement: 20%
    - Student Engagement: 20%
    """
    tei = (
        (topic_completion_pct * 0.20) +
        (student_improvement_pct * 0.30) +
        (faculty_attendance_pct * 0.10) +
        (co_achievement_pct * 0.20) +
        (student_engagement_pct * 0.20)
    )
    tei_score = round(min(100.0, max(0.0, tei)), 1)

    if tei_score >= 88:
        rating = "EXEMPLARY_TEACHER"
    elif tei_score >= 75:
        rating = "PROFICIENT_TEACHER"
    else:
        rating = "DEVELOPING_TEACHER"

    return tei_score, rating
