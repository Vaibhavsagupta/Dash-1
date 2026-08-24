"""
Exam Operating System Core Service Layer & Automatic Cascade Pipeline (Phase 6)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import Test, TestAssignment, TestAttempt, StudentAnswer
from ..questions.models import Question, QuestionOption, QuestionSolution
from ..people.models import Student
from ..curriculum.models import Course
from ..attendance.models import AttendanceSummary
from .evaluator import evaluate_subjective_answer, execute_code_sandbox, calculate_suspicious_score
from .schemas import (
    StartExamSchema, SaveAnswerSchema, SubmitExamSchema,
    StartExamResponse, SaveAnswerResponse, StudentResultResponse, ReplayTimelineResponse
)

class ExamService:

    @staticmethod
    def start_exam_session(db: Session, data: StartExamSchema) -> StartExamResponse:
        test = db.query(Test).filter(Test.id == data.test_id).first()
        if not test:
            raise ValueError(f"Test ID '{data.test_id}' not found.")

        student = db.query(Student).filter(Student.id == data.student_id).first()
        if not student:
            raise ValueError(f"Student ID '{data.student_id}' not found.")

        # Check existing active or uncompleted attempt, else create new
        attempt = db.query(TestAttempt).filter(
            TestAttempt.test_id == test.id,
            TestAttempt.student_id == student.id,
            TestAttempt.submitted_at == None
        ).first()

        if not attempt:
            attempt = TestAttempt(
                test_id=test.id,
                student_id=student.id,
                started_at=datetime.utcnow(),
                score=0.0,
                percentage=0.0,
                tab_switch_count=0,
                fullscreen_violations=0,
                suspicious_score=0.0
            )
            db.add(attempt)
            db.commit()
            db.refresh(attempt)

        # Fetch questions linked to course or test
        questions = db.query(Question).filter(Question.course_id == test.course_id).limit(15).all()

        q_payloads = []
        for q in questions:
            opts = [{"key": o.option_key, "text": o.option_text} for o in q.options]
            q_payloads.append({
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "marks": q.marks,
                "difficulty": q.difficulty,
                "bloom_level": q.bloom_level,
                "options": opts
            })

        return StartExamResponse(
            attempt_id=attempt.id,
            test_id=test.id,
            test_title=test.title,
            course_code=test.course.course_code if test.course else "COURSE",
            course_name=test.course.course_name if test.course else "Subject Exam",
            duration_minutes=test.duration_minutes,
            total_marks=test.total_marks,
            started_at=attempt.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            questions=q_payloads
        )

    @staticmethod
    def auto_save_student_answer(db: Session, data: SaveAnswerSchema) -> SaveAnswerResponse:
        attempt = db.query(TestAttempt).filter(TestAttempt.id == data.attempt_id).first()
        if not attempt:
            raise ValueError(f"Attempt ID '{data.attempt_id}' not found.")

        # Anti-Cheating violation updates
        if data.tab_switch_count is not None:
            attempt.tab_switch_count = max(attempt.tab_switch_count, data.tab_switch_count)
        if data.fullscreen_violations is not None:
            attempt.fullscreen_violations = max(attempt.fullscreen_violations, data.fullscreen_violations)

        attempt.suspicious_score = calculate_suspicious_score(attempt.tab_switch_count, attempt.fullscreen_violations)

        ans_record = db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt.id,
            StudentAnswer.question_id == data.question_id
        ).first()

        if not ans_record:
            ans_record = StudentAnswer(
                attempt_id=attempt.id,
                question_id=data.question_id,
                answer=data.answer,
                code_language=data.code_language
            )
            db.add(ans_record)
        else:
            ans_record.answer = data.answer
            if data.code_language:
                ans_record.code_language = data.code_language

        db.commit()

        return SaveAnswerResponse(
            status="SUCCESS",
            attempt_id=attempt.id,
            question_id=data.question_id,
            auto_saved_at=datetime.utcnow().strftime("%H:%M:%S")
        )

    @staticmethod
    def submit_and_evaluate_exam(db: Session, data: SubmitExamSchema) -> StudentResultResponse:
        attempt = db.query(TestAttempt).filter(TestAttempt.id == data.attempt_id).first()
        if not attempt:
            raise ValueError(f"Attempt ID '{data.attempt_id}' not found.")

        test = attempt.test
        student = attempt.student

        if data.tab_switch_count is not None:
            attempt.tab_switch_count = max(attempt.tab_switch_count, data.tab_switch_count)
        if data.fullscreen_violations is not None:
            attempt.fullscreen_violations = max(attempt.fullscreen_violations, data.fullscreen_violations)

        attempt.suspicious_score = calculate_suspicious_score(attempt.tab_switch_count, attempt.fullscreen_violations)
        attempt.submitted_at = datetime.utcnow()

        # Run Auto Scoring Engine & AI Evaluation Pipeline
        total_obtained = 0.0
        max_possible_marks = 0

        topic_impact_map: Dict[str, Dict[str, Any]] = {}
        co_impact_map: Dict[str, Dict[str, Any]] = {}

        answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt.id).all()

        for ans in answers:
            q = ans.question
            if not q:
                continue

            max_possible_marks += q.marks
            q_topic = q.topic.topic_name if q.topic else "General Concepts"
            q_co = q.outcome.co_code if q.outcome else "CO1"

            if q_topic not in topic_impact_map:
                topic_impact_map[q_topic] = {"topic": q_topic, "total": 0, "correct": 0}
            if q_co not in co_impact_map:
                co_impact_map[q_co] = {"co": q_co, "total": 0, "correct": 0}

            topic_impact_map[q_topic]["total"] += 1
            co_impact_map[q_co]["total"] += 1

            if q.question_type == "MCQ":
                correct_opt = db.query(QuestionOption).filter(
                    QuestionOption.question_id == q.id,
                    QuestionOption.is_correct == True
                ).first()
                user_ans = (ans.answer or "").strip()
                if correct_opt and (user_ans.upper() == correct_opt.option_key.upper() or user_ans == correct_opt.option_text):
                    ans.is_correct = True
                    ans.obtained_marks = float(q.marks)
                    ans.ai_feedback = "MCQ Auto Evaluation: 100% Correct."
                    topic_impact_map[q_topic]["correct"] += 1
                    co_impact_map[q_co]["correct"] += 1
                else:
                    ans.is_correct = False
                    ans.obtained_marks = 0.0
                    ans.ai_feedback = f"MCQ Auto Evaluation: Incorrect. Correct answer key: {correct_opt.option_key if correct_opt else 'A'}"

            elif q.question_type in ["SHORT", "LONG"]:
                pct, obt_marks, feedback = evaluate_subjective_answer(
                    q.question_text,
                    ans.answer or "",
                    q.marks,
                    q.solution.solution_text if q.solution else ""
                )
                ans.obtained_marks = obt_marks
                ans.is_correct = (pct >= 60.0)
                ans.ai_feedback = feedback

                if ans.is_correct:
                    topic_impact_map[q_topic]["correct"] += 1
                    co_impact_map[q_co]["correct"] += 1

            elif q.question_type == "NUMERICAL" or ans.code_language:
                pct, obt_marks, feedback = execute_code_sandbox(
                    ans.answer or "",
                    ans.code_language or "Python",
                    q.marks
                )
                ans.obtained_marks = obt_marks
                ans.is_correct = (pct >= 70.0)
                ans.ai_feedback = feedback

                if ans.is_correct:
                    topic_impact_map[q_topic]["correct"] += 1
                    co_impact_map[q_co]["correct"] += 1

            total_obtained += ans.obtained_marks

        attempt.score = round(total_obtained, 2)
        total_possible = max(1, max_possible_marks if max_possible_marks > 0 else test.total_marks)
        attempt.percentage = round(min(100.0, (total_obtained / total_possible) * 100.0), 2)

        # Automatic Cascade Chain — Update Student AI Risk Score
        att_summary = db.query(AttendanceSummary).filter(AttendanceSummary.student_id == student.id).first()
        if att_summary:
            # Drop risk score if student scored high (>75%), raise if low (<50%)
            if attempt.percentage > 75:
                att_summary.ai_risk_score = max(5.0, att_summary.ai_risk_score - 10.0)
                att_summary.risk_level = "LOW"
            elif attempt.percentage < 50:
                att_summary.ai_risk_score = min(95.0, att_summary.ai_risk_score + 15.0)
                att_summary.risk_level = "HIGH" if att_summary.ai_risk_score > 70 else "MODERATE"

        db.commit()

        # Build Topic Mastery and CO Attainment Lists
        topic_mastery_list = []
        for t_name, t_data in topic_impact_map.items():
            mastery_pct = round((t_data["correct"] / max(1, t_data["total"])) * 100.0, 1)
            topic_mastery_list.append({
                "topic": t_name,
                "mastery_percentage": mastery_pct,
                "status": "MASTERED" if mastery_pct >= 75 else "NEEDS_PRACTICE"
            })

        co_attainment_list = []
        for c_code, c_data in co_impact_map.items():
            attainment_pct = round((c_data["correct"] / max(1, c_data["total"])) * 100.0, 1)
            co_attainment_list.append({
                "co_code": c_code,
                "attainment_percentage": attainment_pct
            })

        recommendations = []
        if attempt.percentage < 60:
            recommendations.append("Recommended: Complete adaptive practice problems for weak topics.")
        if attempt.suspicious_score > 40:
            recommendations.append(f"Flagged for Faculty Review: Suspicious activity score {attempt.suspicious_score}%.")
        if not recommendations:
            recommendations.append("Excellent performance! All course outcomes met.")

        return StudentResultResponse(
            attempt_id=attempt.id,
            test_title=test.title,
            student_name=student.full_name,
            enrollment_no=student.enrollment_no,
            score=attempt.score,
            total_marks=total_possible,
            percentage=attempt.percentage,
            suspicious_score=attempt.suspicious_score,
            tab_switches=attempt.tab_switch_count,
            fullscreen_violations=attempt.fullscreen_violations,
            topic_mastery_impact=topic_mastery_list,
            co_attainment_impact=co_attainment_list,
            ai_recommendations=recommendations
        )

    @staticmethod
    def get_exam_replay_timeline(db: Session, attempt_id: str) -> ReplayTimelineResponse:
        attempt = db.query(TestAttempt).filter(TestAttempt.id == attempt_id).first()
        if not attempt:
            raise ValueError(f"Attempt ID '{attempt_id}' not found.")

        test = attempt.test
        student = attempt.student

        answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt.id).all()
        events = []

        started_time_str = attempt.started_at.strftime("%H:%M:%S") if attempt.started_at else "00:00:00"
        events.append({
            "timestamp": started_time_str,
            "event_type": "SESSION_START",
            "details": "Exam session initiated with Fullscreen lock enabled."
        })

        for i, ans in enumerate(answers):
            q = ans.question
            save_time = ans.created_at.strftime("%H:%M:%S") if ans.created_at else started_time_str
            events.append({
                "timestamp": save_time,
                "event_type": "ANSWER_SAVE",
                "question_id": ans.question_id,
                "question_text": q.question_text if q else f"Question #{i+1}",
                "answer_preview": (ans.answer or "")[:40],
                "details": f"Auto-saved answer for Q{i+1} ({q.question_type if q else 'SHORT'}). Marks: {ans.obtained_marks}"
            })

        if attempt.tab_switch_count > 0:
            events.append({
                "timestamp": attempt.submitted_at.strftime("%H:%M:%S") if attempt.submitted_at else "End",
                "event_type": "TAB_SWITCH_VIOLATION",
                "details": f"Anti-Cheating Violation: {attempt.tab_switch_count} window focus switch events detected."
            })

        submitted_time_str = attempt.submitted_at.strftime("%H:%M:%S") if attempt.submitted_at else "00:00:00"
        events.append({
            "timestamp": submitted_time_str,
            "event_type": "SUBMIT",
            "details": f"Final Submission. Total Score: {attempt.score}/{test.total_marks} ({attempt.percentage}%)."
        })

        return ReplayTimelineResponse(
            attempt_id=attempt.id,
            student_name=student.full_name,
            enrollment_no=student.enrollment_no,
            test_title=test.title,
            total_duration_minutes=test.duration_minutes,
            started_at=started_time_str,
            submitted_at=submitted_time_str,
            score=attempt.score,
            percentage=attempt.percentage,
            suspicious_score=attempt.suspicious_score,
            events=events
        )
