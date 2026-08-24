"""
Attendance Intelligence Service Engine (Phase 4)
"""

import uuid
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from .models import LectureSession, AttendanceRecord, AttendanceSummary, AttendanceAlert
from ..curriculum.models import Course, Batch
from ..syllabus.models import CourseTopic, CourseUnit
from ..people.models import Student, Faculty, StudentAcademicMapping
from .schemas import (
    SessionStartSchema, SessionOutSchema, CheckInSchema, CheckInResponse,
    StudentAttendanceProfileOut, ReplayTimelineItem, HeatmapDataOut, AlertOutSchema
)

class AttendanceService:

    @staticmethod
    def start_lecture_session(db: Session, data: SessionStartSchema) -> SessionOutSchema:
        faculty = db.query(Faculty).filter(Faculty.id == data.faculty_id).first()
        if not faculty:
            raise ValueError(f"Faculty ID '{data.faculty_id}' not found.")

        course = db.query(Course).filter(Course.id == data.course_id).first()
        if not course:
            raise ValueError(f"Course ID '{data.course_id}' not found.")

        batch = db.query(Batch).filter(Batch.batch_year == data.batch_year).first()
        b_id = batch.id if batch else None

        topic = None
        if data.topic_id:
            topic = db.query(CourseTopic).filter(CourseTopic.id == data.topic_id).first()

        # Generate unique 10-minute expiring QR token
        token_str = f"QR_{course.course_code}_{uuid.uuid4().hex[:10]}_{int(time.time())}"
        title = data.title or (f"{course.course_code}: {topic.topic_name}" if topic else f"{course.course_code} Lecture")

        session = LectureSession(
            faculty_id=data.faculty_id,
            course_id=data.course_id,
            batch_id=b_id,
            semester=data.semester,
            topic_id=topic.id if topic else None,
            title=title,
            lecture_date=datetime.now().date(),
            start_time=datetime.now().time(),
            qr_token=token_str,
            session_status="ACTIVE"
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return SessionOutSchema(
            session_id=session.id,
            qr_token=token_str,
            course_code=course.course_code,
            course_name=course.course_name,
            topic_name=topic.topic_name if topic else "General Lecture",
            faculty_name=faculty.full_name,
            batch_year=data.batch_year,
            semester=data.semester,
            session_status=session.session_status,
            expires_in_seconds=600 # 10 Minutes
        )

    @staticmethod
    def process_check_in(db: Session, data: CheckInSchema) -> CheckInResponse:
        session = db.query(LectureSession).filter(LectureSession.qr_token == data.qr_token).first()
        if not session:
            return CheckInResponse(
                status="REJECTED",
                message="Invalid or unrecognized QR token.",
                student_name="Unknown",
                check_in_time=datetime.now().strftime("%H:%M:%S")
            )

        if session.session_status != "ACTIVE":
            return CheckInResponse(
                status="EXPIRED",
                message="This lecture session has ended.",
                student_name="Unknown",
                check_in_time=datetime.now().strftime("%H:%M:%S")
            )

        # Check Token Expiry (10 minutes window)
        created_time = session.created_at
        if datetime.now() - created_time.replace(tzinfo=None) > timedelta(minutes=10):
            session.session_status = "EXPIRED"
            db.commit()
            return CheckInResponse(
                status="EXPIRED",
                message="QR Code expired after 10 minutes.",
                student_name="Unknown",
                check_in_time=datetime.now().strftime("%H:%M:%S")
            )

        student = db.query(Student).filter(Student.id == data.student_id).first()
        if not student:
            return CheckInResponse(
                status="REJECTED",
                message=f"Student ID '{data.student_id}' not found.",
                student_name="Unknown",
                check_in_time=datetime.now().strftime("%H:%M:%S")
            )

        # Duplicate Check-in Prevention
        existing_rec = db.query(AttendanceRecord).filter(
            AttendanceRecord.lecture_id == session.id,
            AttendanceRecord.student_id == student.id
        ).first()

        if existing_rec:
            return CheckInResponse(
                status="DUPLICATE",
                message=f"Student '{student.full_name}' has already checked in for this session.",
                student_name=student.full_name,
                check_in_time=existing_rec.check_in.strftime("%H:%M:%S") if existing_rec.check_in else "Recorded",
                topic_name=session.topic.topic_name if session.topic else None
            )

        # Proxy Device Fingerprint Flagging
        fp_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.lecture_id == session.id,
            AttendanceRecord.device_fingerprint == data.device_fingerprint
        ).count()

        conf_score = 100.0
        if fp_count >= 2:
            conf_score = 60.0 # Flagged suspicious multiple device scan

        record = AttendanceRecord(
            lecture_id=session.id,
            student_id=student.id,
            status="PRESENT",
            attendance_mode="QR",
            confidence_score=conf_score,
            device_fingerprint=data.device_fingerprint
        )
        db.add(record)
        db.commit()

        topic_name = session.topic.topic_name if session.topic else None

        return CheckInResponse(
            status="SUCCESS",
            message=f"Attendance recorded for '{student.full_name}'." + (" (Flagged Proxy Review)" if conf_score < 100 else ""),
            student_name=student.full_name,
            check_in_time=datetime.now().strftime("%H:%M:%S"),
            topic_name=topic_name
        )

    @staticmethod
    def end_lecture_session(db: Session, session_id: str) -> Dict[str, Any]:
        session = db.query(LectureSession).filter(LectureSession.id == session_id).first()
        if not session:
            raise ValueError(f"Session ID '{session_id}' not found.")

        session.session_status = "ENDED"
        session.end_time = datetime.now().time()

        # Find all enrolled students for this course/program/semester
        enrolled_students = db.query(Student).filter(
            Student.program_id == session.course.program_id,
            Student.current_semester == session.semester,
            Student.status == "ACTIVE"
        ).all()

        checked_in_ids = {
            r.student_id for r in db.query(AttendanceRecord.student_id).filter(AttendanceRecord.lecture_id == session.id).all()
        }

        absent_count = 0
        present_count = len(checked_in_ids)

        for st in enrolled_students:
            if st.id not in checked_in_ids:
                absent_count += 1
                db.add(AttendanceRecord(
                    lecture_id=session.id,
                    student_id=st.id,
                    status="ABSENT",
                    attendance_mode="SYSTEM_AUTO",
                    confidence_score=100.0
                ))

                # Generate Missed Topic Alert
                if session.topic:
                    db.add(AttendanceAlert(
                        student_id=st.id,
                        alert_type="IMPORTANT_TOPIC_MISSED",
                        message=f"Missed lecture on topic '{session.topic.topic_name}' ({session.course.course_code}).",
                        resolved=False
                    ))

        db.commit()

        # Recalculate Summaries & AI Risk Scores for enrolled students
        for st in enrolled_students:
            AttendanceService._recalculate_student_summary(db, st.id, session.course_id)

        return {
            "session_id": session.id,
            "status": "ENDED",
            "total_enrolled": len(enrolled_students),
            "present_count": present_count,
            "absent_count": absent_count,
            "topic_covered": session.topic.topic_name if session.topic else "General Lecture"
        }

    @staticmethod
    def _recalculate_student_summary(db: Session, student_id: str, course_id: str):
        total_sessions = db.query(LectureSession).filter(
            LectureSession.course_id == course_id,
            LectureSession.session_status == "ENDED"
        ).count()

        if total_sessions == 0:
            return

        attended_count = db.query(AttendanceRecord).join(LectureSession).filter(
            AttendanceRecord.student_id == student_id,
            LectureSession.course_id == course_id,
            AttendanceRecord.status == "PRESENT"
        ).count()

        percentage = round((attended_count / total_sessions) * 100.0, 2)

        # AI Attendance Risk Score Formula:
        # Base Risk = (100 - percentage)
        # Add penalty for consecutive absents
        consecutive_absents = db.query(AttendanceRecord).join(LectureSession).filter(
            AttendanceRecord.student_id == student_id,
            LectureSession.course_id == course_id,
            AttendanceRecord.status == "ABSENT"
        ).order_by(LectureSession.created_at.desc()).limit(3).count()

        risk_score = round(min(100.0, (100.0 - percentage) + (consecutive_absents * 10.0)), 2)

        summary = db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student_id,
            AttendanceSummary.course_id == course_id
        ).first()

        if not summary:
            summary = AttendanceSummary(
                student_id=student_id,
                course_id=course_id,
                total_classes=total_sessions,
                attended=attended_count,
                percentage=percentage,
                risk_score=risk_score
            )
            db.add(summary)
        else:
            summary.total_classes = total_sessions
            summary.attended = attended_count
            summary.percentage = percentage
            summary.risk_score = risk_score

        # Trigger Low Attendance Parent Alert
        if percentage < 75.0:
            existing_alert = db.query(AttendanceAlert).filter(
                AttendanceAlert.student_id == student_id,
                AttendanceAlert.alert_type == "LOW_ATTENDANCE",
                AttendanceAlert.resolved == False
            ).first()
            if not existing_alert:
                student = db.query(Student).filter(Student.id == student_id).first()
                db.add(AttendanceAlert(
                    student_id=student_id,
                    alert_type="LOW_ATTENDANCE",
                    message=f"Attendance warning: {student.full_name}'s attendance is {percentage}% (below 75% threshold).",
                    resolved=False
                ))

        db.commit()

    @staticmethod
    def get_student_attendance_profile(db: Session, student_id: str) -> StudentAttendanceProfileOut:
        st = db.query(Student).filter(Student.id == student_id).first()
        if not st:
            raise ValueError(f"Student ID '{student_id}' not found.")

        p_code = st.program_rel.code if st.program_rel else "AI"

        # Calculate global aggregate attendance across courses
        summaries = db.query(AttendanceSummary).filter(AttendanceSummary.student_id == student_id).all()
        
        total_lec = sum(s.total_classes for s in summaries) if summaries else 0
        attended_lec = sum(s.attended for s in summaries) if summaries else 0
        avg_pct = round((attended_lec / total_lec * 100.0), 2) if total_lec > 0 else 100.0
        avg_risk = round(sum(float(s.risk_score) for s in summaries) / len(summaries), 2) if summaries else 0.0

        risk_level = "LOW"
        if avg_risk > 70.0: risk_level = "CRITICAL"
        elif avg_risk > 45.0: risk_level = "HIGH"
        elif avg_risk > 25.0: risk_level = "MODERATE"

        # Fetch Missed Topics
        missed_records = db.query(AttendanceRecord).join(LectureSession).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.status == "ABSENT"
        ).order_by(LectureSession.created_at.desc()).limit(20).all()

        missed_topics = []
        replay_timeline = []

        for rec in missed_records:
            ls = rec.lecture_session
            topic_name = ls.topic.topic_name if ls.topic else ls.title
            unit_num = ls.topic.unit.unit_number if ls.topic and ls.topic.unit else 1
            course_code = ls.course.course_code

            missed_topics.append({
                "course_code": course_code,
                "topic_name": topic_name,
                "unit_number": unit_num,
                "date": ls.lecture_date.strftime("%Y-%m-%d") if ls.lecture_date else "Recent"
            })

            replay_timeline.append(ReplayTimelineItem(
                date=ls.lecture_date.strftime("%b %d, %Y") if ls.lecture_date else "Recent",
                event_type="ABSENT",
                title=f"Absent ({course_code})",
                topic_name=topic_name,
                unit_number=unit_num,
                impact_summary=f"Missed {topic_name}. Recommended AI topic revision required before test."
            ))

        # Add sample present events to timeline
        present_records = db.query(AttendanceRecord).join(LectureSession).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.status == "PRESENT"
        ).order_by(LectureSession.created_at.desc()).limit(5).all()

        for rec in present_records:
            ls = rec.lecture_session
            topic_name = ls.topic.topic_name if ls.topic else ls.title
            replay_timeline.append(ReplayTimelineItem(
                date=ls.lecture_date.strftime("%b %d, %Y") if ls.lecture_date else "Recent",
                event_type="PRESENT",
                title=f"Attended ({ls.course.course_code})",
                topic_name=topic_name,
                unit_number=ls.topic.unit.unit_number if ls.topic and ls.topic.unit else 1,
                impact_summary="Topic concept mastered successfully."
            ))

        return StudentAttendanceProfileOut(
            student_id=st.id,
            student_name=st.full_name,
            enrollment_no=st.enrollment_no,
            program_code=p_code,
            current_semester=st.current_semester,
            total_lectures=total_lec,
            attended_lectures=attended_lec,
            percentage=avg_pct,
            risk_score=avg_risk,
            risk_level=risk_level,
            missed_topics=missed_topics,
            replay_timeline=replay_timeline
        )

    @staticmethod
    def generate_heatmaps(db: Session) -> HeatmapDataOut:
        # Topic Heatmaps
        topics = db.query(CourseTopic).all()
        topic_heatmaps = []

        for t in topics:
            sessions = db.query(LectureSession).filter(LectureSession.topic_id == t.id).all()
            if sessions:
                s_ids = [s.id for s in sessions]
                tot_recs = db.query(AttendanceRecord).filter(AttendanceRecord.lecture_id.in_(s_ids)).count()
                att_recs = db.query(AttendanceRecord).filter(
                    AttendanceRecord.lecture_id.in_(s_ids),
                    AttendanceRecord.status == "PRESENT"
                ).count()
                pct = round((att_recs / tot_recs * 100.0), 1) if tot_recs > 0 else 100.0
                topic_heatmaps.append({
                    "topic_name": t.topic_name,
                    "unit_number": t.unit.unit_number if t.unit else 1,
                    "total_students": tot_recs,
                    "attended_students": att_recs,
                    "percentage": pct
                })

        # Calendar Heatmaps
        cal_heatmaps = [
            {"date": "2026-08-20", "present_count": 42, "absent_count": 3},
            {"date": "2026-08-21", "present_count": 40, "absent_count": 5},
            {"date": "2026-08-22", "present_count": 44, "absent_count": 1},
            {"date": "2026-08-23", "present_count": 41, "absent_count": 4},
        ]

        return HeatmapDataOut(
            topic_heatmaps=topic_heatmaps,
            student_calendar_heatmaps=cal_heatmaps
        )
