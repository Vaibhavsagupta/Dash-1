from app.models import Student, Teacher

def calculate_prs(student: Student) -> float:
    """
    Calculate Student Placement Readiness Score (PRS).
    Formula:
    0.20 * Attendance +
    0.20 * DSA +
    0.20 * ML +
    0.15 * QA +
    0.15 * Projects (Normalized 0-100) +
    0.10 * Mock Interview
    """
    # Normalize Projects: Assuming max 5 projects -> 100%
    # If projects > 5, cap at 100
    project_norm = min(student.projects_score * 20, 100)

    prs = (
        0.20 * student.attendance +
        0.20 * student.dsa_score +
        0.20 * student.ml_score +
        0.15 * student.qa_score +
        0.15 * project_norm +
        0.10 * student.mock_interview_score
    )
    return round(prs, 2)

def calculate_tei(teacher: Teacher) -> float:
    """
    Calculate Teacher Effectiveness Index (TEI).
    Formula:
    0.35 * Avg Student Improvement +
    0.30 * Feedback +
    0.20 * Content Quality +
    0.15 * Placement Conversion

    Assumptions:
    - Feedback & Content Quality are 1-5 scale -> normalize to 0-100 (score * 20).
    - Avg Improvement & Placement Conversion are percentages (0-100).
    """
    
    # Normalize 1-5 stats to 0-100
    feedback_norm = teacher.feedback_score * 20
    quality_norm = teacher.content_quality_score * 20
    
    tei = (
        0.35 * teacher.avg_improvement + # Already percentage
        0.30 * feedback_norm +
        0.20 * quality_norm +
        0.15 * teacher.placement_conversion # Already percentage
    )
    return round(tei, 2)
