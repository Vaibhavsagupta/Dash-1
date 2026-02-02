from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database, auth
import math
from typing import Optional

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/student/{student_id}/observations")
def get_student_observations(student_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    # Security check: Students can only see their own data
    if current_user.role == models.UserRole.student and current_user.linked_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other students' data")
    
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found")
    
    improvement = round(student.post_score - student.pre_score, 1) if student.pre_score is not None and student.post_score is not None else 0.0
    status = "Improved" if improvement > 0 else "Needs Improvement" if improvement < 0 else "Stable"
    
    return {
        "pre": {
            "score": student.pre_score,
            "communication": student.pre_communication,
            "engagement": student.pre_engagement,
            "knowledge": student.pre_subject_knowledge,
            "confidence": student.pre_confidence,
            "fluency": student.pre_fluency,
            "remarks": student.pre_remarks,
            "status": student.pre_status
        },
        "post": {
            "score": student.post_score,
            "communication": student.post_communication,
            "engagement": student.post_engagement,
            "knowledge": student.post_subject_knowledge,
            "confidence": student.post_confidence,
            "fluency": student.post_fluency,
            "remarks": student.post_remarks,
            "status": student.post_status
        },
        "improvement_score": improvement,
        "status": status,
        "batch_id": student.batch_id
    }

@router.get("/batch/{batch_id}/observations")
def get_batch_observations(batch_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    # Security check: Admins see all, Teachers see assigned batches
    if current_user.role == models.UserRole.teacher:
        teacher_id = current_user.linked_id
        # Check if teacher has any lectures for this batch
        assignment_exists = db.query(models.Lecture).filter(
            models.Lecture.teacher_id == teacher_id,
            models.Lecture.batch == batch_id
        ).first()
        if not assignment_exists:
            raise HTTPException(status_code=403, detail="Not authorized to view other batches' data")
    elif current_user.role == models.UserRole.student:
        raise HTTPException(status_code=403, detail="Students cannot view batch-wide observations")
    
    students = db.query(models.Student).filter(models.Student.batch_id == batch_id).all()
    if not students: return {"message": "No data for this batch", "avg_pre": 0, "avg_post": 0, "improvement": 0, "status_distribution": {}}
    
    avg_pre = sum(s.pre_score for s in students) / len(students)
    avg_post = sum(s.post_score for s in students) / len(students)
    improvement = round(avg_post - avg_pre, 1)
    
    dist = {}
    for s in students:
        s_improvement = s.post_score - s.pre_score
        s_status = "Improved" if s_improvement > 0 else "Needs Improvement" if s_improvement < 0 else "Stable"
        dist[s_status] = dist.get(s_status, 0) + 1
        
    return {
        "avg_pre_score": round(avg_pre, 1),
        "avg_post_score": round(avg_post, 1),
        "improvement_pct": improvement,
        "status_distribution": dist,
        "student_count": len(students)
    }

def calculate_prs(student):
    # Placement Readiness Score calculation
    # Formula: Average of DSA, ML, QA, Projects, Mock
    total = sum([
        student.dsa_score or 0,
        student.ml_score or 0,
        student.qa_score or 0,
        student.projects_score or 0,
        student.mock_interview_score or 0
    ])
    return round(total / 5.0, 1) if total else 0.0

@router.get("/students/all")
def get_students(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    # Security check:
    # Admins: All students
    # Teachers: Students in their batches
    # Students: Only themselves
    
    query = db.query(models.Student)
    
    if current_user.role == models.UserRole.teacher:
        teacher_id = current_user.linked_id
        # Get batches assigned to this teacher
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        query = query.filter(models.Student.batch_id.in_(batch_list))
    elif current_user.role == models.UserRole.student:
        student_id = current_user.linked_id
        query = query.filter(models.Student.student_id == student_id)
        
    students = query.all()
    results = []
    
    student_prs = []
    for s in students:
        prs = calculate_prs(s)
        student_prs.append((s, prs))
    
    # Sort by PRS descending
    student_prs.sort(key=lambda x: x[1], reverse=True)
    total_students = len(students)
    
    for rank0, (s, prs) in enumerate(student_prs):
        rank = rank0 + 1
        percentile = 0.0
        if total_students > 0:
            percentile = round(((total_students - rank) / total_students) * 100, 1)
        
        # Get assessment trend (totals) for cards
        ass_trend = db.query(models.Assessment).filter(models.Assessment.student_id == s.student_id).order_by(models.Assessment.assessment_name).all()
        trend_scores = [a.total_score for a in ass_trend]

        results.append({
            "student_id": s.student_id,
            "name": s.name,
            "prs_score": prs,
            "rank": rank,
            "percentile": percentile,
            "attendance": s.attendance,
            "dsa": s.dsa_score,
            "ml": s.ml_score,
            "qa": s.qa_score,
            "projects": s.projects_score,
            "mock": s.mock_interview_score,
            "pre_score": s.pre_score,
            "post_score": s.post_score,
            "assessment_trend": trend_scores,
            # Qualitative breakdown for individual radar
            "pre_comm": s.pre_communication,
            "post_comm": s.post_communication,
            "pre_eng": s.pre_engagement,
            "post_eng": s.post_engagement,
            "pre_knob": s.pre_subject_knowledge,
            "post_knob": s.post_subject_knowledge,
            "pre_conf": s.pre_confidence,
            "post_conf": s.post_confidence,
            "pre_fluency": s.pre_fluency,
            "post_fluency": s.post_fluency,
            "rag": s.rag_status,
            "rag_history": [{"date": log.date.isoformat(), "status": log.status, "period": log.period_name} for log in db.query(models.RAGLog).filter(models.RAGLog.student_id == s.student_id).order_by(models.RAGLog.date).all()]
        })
    return results

@router.get("/student/{student_id}/detailed")
def get_student_detailed_analytics(student_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    # Security check: Students can only see their own data
    if current_user.role == models.UserRole.student and current_user.linked_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other students' data")
        
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found")
    
    all_students = db.query(models.Student).all()
    
    # Analyze detailed metrics
    subjects_map = {
        'dsa_score': 'DSA', 'ml_score': 'ML', 'qa_score': 'QA', 
        'projects_score': 'Projects', 'mock_interview_score': 'Mock Interview', 
        'pre_score': 'Pre Observation', 'post_score': 'Post Observation', 
        'attendance': 'Attendance'
    }
    
    metrics = {subj: [] for subj in subjects_map.keys()}
    for s in all_students:
        for subj in subjects_map.keys():
            metrics[subj].append(getattr(s, subj, 0))
            
    class_stats = {}
    student_percentiles = {}
    
    for subj, scores in metrics.items():
        if not scores:
            class_stats[subj] = {"avg": 0, "max": 0, "min": 0}
            student_percentiles[subj] = 0
            continue
            
        avg_val = sum(scores) / len(scores)
        max_val = max(scores)
        min_val = min(scores)
        class_stats[subj] = {"avg": round(avg_val, 1), "max": max_val, "min": min_val}
        
        student_score = getattr(student, subj, 0)
        better_than = sum(1 for s in scores if s < student_score)
        percentile = (better_than / len(scores)) * 100 if scores else 0
        student_percentiles[subj] = round(percentile, 1)

    strengths = []
    weaknesses = []
    
    analysis_items = []
    for subj, label in subjects_map.items():
        if subj == 'attendance': continue 
        score = getattr(student, subj, 0)
        avg = class_stats[subj]["avg"]
        diff = score - avg
        analysis_items.append({"subject": label, "score": score, "diff": round(diff, 1), "avg": avg})
    
    # Sort by diff: positive top for strengths, negative bottom for weaknesses
    analysis_items.sort(key=lambda x: x["diff"], reverse=True)
    
    strengths = [item for item in analysis_items if item["diff"] > 0]
    weaknesses = [item for item in analysis_items if item["diff"] < 0]
    
    # If no weaknesses (perfect student?), show nothing, but usually there's something below avg
    # Limit to top 3 for clarity
    strengths = strengths[:3]
    weaknesses = sorted(weaknesses, key=lambda x: x["diff"])[:3] # Show most critical first
    
    # Placement Readiness (Weighted: Tech 50%, Mock 30%, QA 20%)
    placement_readiness = round(
        (student.dsa_score * 0.4) + (student.ml_score * 0.1) + 
        (student.qa_score * 0.2) + (student.mock_interview_score * 0.3)
    , 1)

    # Attendance Trend (from logs)
    attendance_logs = db.query(models.AttendanceLog).filter(models.AttendanceLog.student_id == student_id).all()
    attendance_history = [{"date": log.date.isoformat(), "status": log.status} for log in attendance_logs]
    
    # RAG Trend
    rag_logs = db.query(models.RAGLog).filter(models.RAGLog.student_id == student_id).order_by(models.RAGLog.date).all()
    rag_history = [{"date": log.date.isoformat(), "status": log.status, "period": log.period_name} for log in rag_logs]
            
    # Assessment Trend
    # Batch-wide assessment stats to calculate historical percentiles
    all_assessments = db.query(models.Assessment).all()
    ass_map = {} # { "Assessment 1": { "technical": [scores...], "math": [...], ... } }
    
    for a in all_assessments:
        if a.assessment_name not in ass_map:
            ass_map[a.assessment_name] = {"technical": [], "verbal": [], "math": [], "logic": [], "total": []}
        ass_map[a.assessment_name]["technical"].append(a.technical_score)
        ass_map[a.assessment_name]["verbal"].append(a.verbal_score)
        ass_map[a.assessment_name]["math"].append(a.math_score)
        ass_map[a.assessment_name]["logic"].append(a.logic_score)
        ass_map[a.assessment_name]["total"].append(a.total_score)

    def calc_live_percentile(score, score_list):
        if not score_list: return 0
        better_than = sum(1 for s in score_list if s < score)
        return round((better_than / len(score_list)) * 100, 1)

    assessments = db.query(models.Assessment).filter(models.Assessment.student_id == student_id).order_by(models.Assessment.assessment_name).all()
    assessment_history = []
    
    for a in assessments:
        batch_scores = ass_map.get(a.assessment_name, {})
        assessment_history.append({
            "name": a.assessment_name,
            "technical": a.technical_score,
            "verbal": a.verbal_score,
            "math": a.math_score,
            "logic": a.logic_score,
            "total": a.total_score,
            "percentage": a.percentage,
            "percentiles": {
                "technical": calc_live_percentile(a.technical_score, batch_scores.get("technical", [])),
                "verbal": calc_live_percentile(a.verbal_score, batch_scores.get("verbal", [])),
                "math": calc_live_percentile(a.math_score, batch_scores.get("math", [])),
                "logic": calc_live_percentile(a.logic_score, batch_scores.get("logic", [])),
                "total": calc_live_percentile(a.total_score, batch_scores.get("total", [])),
            }
        })

    return {
        "student": student,
        "assessment_history": assessment_history,
        "attendance_history": attendance_history,
        "rag_history": rag_history,
        "class_stats": class_stats,
        "percentiles": student_percentiles,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "placement_readiness": placement_readiness,
        "rank": db.query(models.Student).count() - sum(1 for s in db.query(models.Student).all() if calculate_prs(s) < calculate_prs(student))
    }

@router.get("/dashboard/admin")
def get_admin_dashboard_data(db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_active_admin)):
    students = db.query(models.Student).all()
    total_students = len(students)
    
    # Top 5 students by PRS
    student_prs = []
    for s in students:
        prs = calculate_prs(s)
        student_prs.append({"id": s.student_id, "name": s.name, "prs": prs})
    
    student_prs.sort(key=lambda x: x["prs"], reverse=True)
    top_students = student_prs[:5]
    
    # Mock Teacher performance
    teachers = db.query(models.Teacher).all()
    teacher_performance = []
    for t in teachers:
        teacher_performance.append({
            "id": t.teacher_id,
            "name": t.name,
            "subject": t.subject,
            "tei": 85 + (len(t.name) % 10)
        })
        
    return {
        "total_students": total_students,
        "top_students": top_students,
        "teacher_performance": teacher_performance
    }

@router.get("/batch/comprehensive_stats")
def get_batch_comprehensive_stats(date: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user_obj)):
    # Security & Data Isolation
    query = db.query(models.Student)
    
    if current_user.role == models.UserRole.teacher:
        teacher_id = current_user.linked_id
        assigned_batches = db.query(models.Lecture.batch).filter(models.Lecture.teacher_id == teacher_id).distinct().all()
        batch_list = [b[0] for b in assigned_batches]
        query = query.filter(models.Student.batch_id.in_(batch_list))
    elif current_user.role == models.UserRole.student:
        raise HTTPException(status_code=403, detail="Students cannot access batch-wide analytics")
    
    students = query.all()
    if not students: return {"error": "No students found"}
    n = len(students)
    
    snapshot_date = None
    if date:
        from datetime import datetime
        try:
            snapshot_date = datetime.strptime(date, "%Y-%m-%d").date()
        except:
            pass

    # helper for averages
    def safe_avg(attr):
        vals = [getattr(s, attr) for s in students if (getattr(s, attr) or 0) > 0]
        return sum(vals) / len(vals) if vals else 0.0

    # ... (Keep existing simple averages for overhead stats as they are less time-sensitive in this context) ...
    # For now, we will focus on backdating the CORRELATION DATA (Scatter Plot) as requested.
    
    avg_pre_score = safe_avg("pre_score")
    avg_post_score = safe_avg("post_score")
    avg_pre_comm = safe_avg("pre_communication")
    avg_post_comm = safe_avg("post_communication")
    avg_pre_fluency = safe_avg("pre_fluency")
    avg_post_fluency = safe_avg("post_fluency")
    avg_pre_eng = safe_avg("pre_engagement")
    avg_post_eng = safe_avg("post_engagement")
    avg_pre_knob = safe_avg("pre_subject_knowledge")
    avg_post_knob = safe_avg("post_subject_knowledge")
    avg_pre_conf = safe_avg("pre_confidence")
    avg_post_conf = safe_avg("post_confidence")

    # Detailed RAG Analysis & Counts (Keep current for now)
    rag_counts = {"Green": 0, "Amber": 0, "Red": 0}
    rag_students = {"Green": [], "Amber": [], "Red": []}
    for s in students:
        status = s.rag_status
        if not status: status = "Green"
        status = status.strip().capitalize()
        cat = "Green"
        if "Red" in status: cat = "Red"
        elif "Amber" in status: cat = "Amber"
        
        rag_counts[cat] += 1
        rag_students[cat].append({
            "id": s.student_id,
            "name": s.name,
            "avg_score": round(((s.dsa_score or 0) + (s.ml_score or 0) + (s.qa_score or 0)) / 3.0, 1),
            "attendance": s.attendance
        })

    # Student growth data (Keep current)
    student_growth = []
    for s in students:
        student_growth.append({
            "name": s.name,
            "pre": s.pre_score or 0,
            "post": s.post_score or 0,
            "growth": round((s.post_score or 0) - (s.pre_score or 0), 1)
        })
    top_improvers = sorted(student_growth, key=lambda x: x["growth"], reverse=True)[:10]

    # ... (soft skill levels) ...
    status_map = {"critical": 1, "poor": 2, "needs": 3, "average": 4, "improved": 5, "much improved": 6}
    def get_level(status):
        if not status: return 0
        status = status.lower().strip()
        for k, v in status_map.items():
            if k in status: return v
        return 0
    pre_levels = [get_level(s.pre_status) for s in students if get_level(s.pre_status) > 0]
    post_levels = [get_level(s.post_status) for s in students if get_level(s.post_status) > 0]
    avg_pre_level = sum(pre_levels) / len(pre_levels) if pre_levels else 0.0
    avg_post_level = sum(post_levels) / len(post_levels) if post_levels else 0.0

    # Numerical Observation Averages (Phase 6)
    all_pre_scores = [s.pre_score for s in students if s.pre_score is not None]
    all_post_scores = [s.post_score for s in students if s.post_score is not None]
    avg_pre_score = sum(all_pre_scores) / len(all_pre_scores) if all_pre_scores else 0.0
    avg_post_score = sum(all_post_scores) / len(all_post_scores) if all_post_scores else 0.0

    # Subject-wise (Keep current)
    subject_avgs = {
        "DSA": safe_avg("dsa_score"), "ML": safe_avg("ml_score"), "QA": safe_avg("qa_score"),
        "Projects": safe_avg("projects_score"), "Mock Interview": safe_avg("mock_interview_score")
    }

    # --- CORRELATION DATA (This is what needs backdating) ---
    correlation_data = []

    if snapshot_date:
        # 1. Fetch all attendance logs <= date
        att_logs_query = db.query(models.AttendanceLog).filter(models.AttendanceLog.date <= snapshot_date).all()
        # Group by student
        from collections import defaultdict
        att_map = defaultdict(list)
        for log in att_logs_query:
            val = 100 if log.status in ['Present', 'Late', 'Excused'] else 0
            att_map[log.student_id].append(val)
        
        # 2. Fetch all assessments <= date
        ass_query = db.query(models.Assessment).filter(models.Assessment.date <= snapshot_date).all()
        ass_map = defaultdict(list)
        for a in ass_query:
            if a.percentage is not None:
                ass_map[a.student_id].append(a.percentage)
        
        for s in students:
            # Backdated Attendance
            logs = att_map.get(s.student_id, [])
            att_pct = round(sum(logs) / len(logs), 1) if logs else 0
            
            # Backdated Avg Score
            scores = ass_map.get(s.student_id, [])
            avg_score = round(sum(scores) / len(scores), 1) if scores else 0
            
            correlation_data.append({
                "id": s.student_id,
                "name": s.name, 
                "attendance": att_pct, 
                "score": avg_score,
                "growth": round((s.post_score or 0) - (s.pre_score or 0), 1) # Growth is static for now
            })
            
    else:
        # Default Current State
        for s in students:
            avg_s = ((s.dsa_score or 0) + (s.ml_score or 0) + (s.qa_score or 0) + (s.projects_score or 0) + (s.mock_interview_score or 0)) / 5.0
            correlation_data.append({
                "id": s.student_id,
                "name": s.name, 
                "attendance": s.attendance or 0, 
                "score": round(avg_s, 1),
                "growth": round((s.post_score or 0) - (s.pre_score or 0), 1)
            })

    # Distributions
    def get_dist(attr):
        dist = {"0-2": 0, "2-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
        for s in students:
            val = getattr(s, attr) or 0.0
            if val <= 2: dist["0-2"] += 1
            elif val <= 4: dist["2-4"] += 1
            elif val <= 6: dist["4-6"] += 1
            elif val <= 8: dist["6-8"] += 1
            else: dist["8-10"] += 1
        return dist
    skill_distributions = {
        "communication": {"pre": get_dist("pre_communication"), "post": get_dist("post_communication")},
        "fluency": {"pre": get_dist("pre_fluency"), "post": get_dist("post_fluency")},
        "knowledge": {"pre": get_dist("pre_subject_knowledge"), "post": get_dist("post_subject_knowledge")}
    }

    # Subject-wise RAG Impact (Compare Green vs Red)
    subject_rag_impact = {}
    green_students = [s for s in students if "Green" in (s.rag_status or "Green")]
    red_students = [s for s in students if "Red" in (s.rag_status or "")]
    
    for label, attr in [("DSA", "dsa_score"), ("ML", "ml_score"), ("QA", "qa_score"), ("Mock", "mock_interview_score")]:
        g_avg = sum([getattr(s, attr) or 0 for s in green_students]) / len(green_students) if green_students else 0
        r_avg = sum([getattr(s, attr) or 0 for s in red_students]) / len(red_students) if red_students else 0
        subject_rag_impact[label] = {"green": round(g_avg, 1), "red": round(r_avg, 1)}

    # Batch-wide assessment trend
    all_assessments = db.query(models.Assessment).all()
    ass_map = {}
    for a in all_assessments:
        if a.assessment_name not in ass_map:
            ass_map[a.assessment_name] = {"technical": [], "verbal": [], "math": [], "logic": [], "total": [], "count": 0}
        
        m = ass_map[a.assessment_name]
        m["technical"].append(a.technical_score)
        m["verbal"].append(a.verbal_score)
        m["math"].append(a.math_score)
        m["logic"].append(a.logic_score)
        m["total"].append(a.total_score)
        m["count"] += 1
    
    batch_assessment_history = []
    for name in sorted(ass_map.keys()):
        m = ass_map[name]
        batch_assessment_history.append({
            "name": name,
            "technical": round(sum(m["technical"]) / m["count"], 1) if m["count"] > 0 else 0,
            "verbal": round(sum(m["verbal"]) / m["count"], 1) if m["count"] > 0 else 0,
            "math": round(sum(m["math"]) / m["count"], 1) if m["count"] > 0 else 0,
            "logic": round(sum(m["logic"]) / m["count"], 1) if m["count"] > 0 else 0,
            "total": round(sum(m["total"]) / m["count"], 1) if m["count"] > 0 else 0
        })

    # Calculate daily/weekly average attendance trend
    # We'll use a simple approach: Group logs by date and calc average
    attendance_trend_data = []
    # Fetch all logs (in a real app, might limit window)
    all_att_logs = db.query(models.AttendanceLog).order_by(models.AttendanceLog.date).all()
    
    if all_att_logs:
        from collections import defaultdict
        date_map = defaultdict(list)
        for log in all_att_logs:
            # log.status is 'Present', 'Absent', 'Late', etc.
            # Assuming 'Present' or 'Late' counts as attended? 
            # Let's count 'Present' as 100, 'Late' as 100 (or 50?), 'Absent' as 0
            val = 100 if log.status in ['Present', 'Late', 'Excused'] else 0
            date_map[log.date].append(val)
        
        for d, vals in date_map.items():
            avg_att = sum(vals) / len(vals)
            attendance_trend_data.append({"date": d.isoformat(), "attendance": round(avg_att, 1)})
        
        attendance_trend_data.sort(key=lambda x: x["date"])

    return {
        "score_comparison": {"pre": round(avg_pre_score, 1), "post": round(avg_post_score, 1)},
        "level_comparison": {"pre": round(avg_pre_level, 1), "post": round(avg_post_level, 1)},
        "communication_comparison": {"pre": round(avg_pre_comm, 1), "post": round(avg_post_comm, 1)},
        "fluency_comparison": {"pre": round(avg_pre_fluency, 1), "post": round(avg_post_fluency, 1)},
        "engagement_comparison": {"pre": round(avg_pre_eng, 1), "post": round(avg_post_eng, 1)},
        "knowledge_comparison": {"pre": round(avg_pre_knob, 1), "post": round(avg_post_knob, 1)},
        "confidence_comparison": {"pre": round(avg_pre_conf, 1), "post": round(avg_post_conf, 1)},
        "rag_distribution": rag_counts,
        "rag_students": rag_students,
        "subject_rag_impact": subject_rag_impact,
        "student_count": n,
        "student_growth_data": student_growth,
        "top_improvers": top_improvers,
        "subject_avgs": subject_avgs,
        "correlation_data": correlation_data,
        "skill_distributions": skill_distributions,
        "batch_assessment_history": batch_assessment_history,
        "attendance_trend": attendance_trend_data,
        "avg_pre_score": round(avg_pre_score, 1),
        "avg_post_score": round(avg_post_score, 1),
        "total_improvement": round(avg_post_score - avg_pre_score, 1)
    }

@router.get("/teacher/{teacher_id}/detailed")
def get_teacher_detailed_analytics(teacher_id: str, db: Session = Depends(database.get_db), current_admin: models.User = Depends(auth.get_current_active_admin)):
    teacher = db.query(models.Teacher).filter(models.Teacher.teacher_id == teacher_id).first()
    if not teacher: raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Calculate TEI Breakdown
    # Standard weighting: Improvement (40%), Feedback (30%), Quality (20%), Conversion (10%)
    tei = (
        (teacher.avg_improvement or 0) * 0.4 + 
        (teacher.feedback_score * 20) * 0.3 + 
        (teacher.content_quality_score * 20) * 0.2 + 
        (teacher.placement_conversion or 0) * 0.1
    )
    
    # Syllabus Progression (Mocked or from units if available)
    units = db.query(models.Unit).filter(models.Unit.teacher_id == teacher_id).all()
    progression = []
    total_prog = 0
    if units:
        for u in units:
            progression.append({"title": u.title, "progress": u.progress, "status": u.status})
            total_prog += u.progress
        avg_prog = total_prog / len(units)
    else:
        avg_prog = 0
        
    return {
        "teacher": {
            "id": teacher.teacher_id,
            "name": teacher.name,
            "subject": teacher.subject,
            "tei": round(tei, 1),
            "avg_improvement": teacher.avg_improvement,
            "feedback": teacher.feedback_score,
            "quality": teacher.content_quality_score,
            "conversion": teacher.placement_conversion,
            "syllabus_completion": round(avg_prog, 1)
        },
        "breakdown": {
            "improvement": teacher.avg_improvement,
            "feedback": teacher.feedback_score * 20,
            "quality": teacher.content_quality_score * 20,
            "conversion": teacher.placement_conversion
        },
        "progression": progression
    }

@router.get("/student/{student_id}/batch-info")
def get_student_batch_info(
    student_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user_obj)
):
    # Security check: Students can only see their own data
    if current_user.role == models.UserRole.student and current_user.linked_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other students' data")
        
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Calculate duration
    duration = "N/A"
    if student.start_date and student.end_date:
        delta = student.end_date - student.start_date
        duration = f"{delta.days // 30} Months" if delta.days > 30 else f"{delta.days} Days"
        
    # Find a trainer for this batch
    trainer = "Lead Faculty"
    first_lecture = db.query(models.Lecture, models.Teacher.name) \
        .join(models.Teacher, models.Lecture.teacher_id == models.Teacher.teacher_id) \
        .filter(models.Lecture.batch == student.batch_id) \
        .first()
    if first_lecture:
        trainer = first_lecture[1]
        
    # Assessment Avg
    avg_score = round(((student.dsa_score or 0) + (student.ml_score or 0) + (student.qa_score or 0) + (student.projects_score or 0) + (student.mock_interview_score or 0)) / 5.0, 1)

    return {
        "batch_name": student.batch_id or "Universal Batch",
        "trainer": trainer,
        "duration": duration,
        "start_date": student.start_date.isoformat() if student.start_date else None,
        "end_date": student.end_date.isoformat() if student.end_date else None,
        "attendance": f"{student.attendance}%",
        "assessment_avg": f"{avg_score}%"
    }
