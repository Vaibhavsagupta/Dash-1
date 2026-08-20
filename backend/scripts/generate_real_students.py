import os
import random
import datetime
import pandas as pd
import json

def generate_real_student_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)
    data_dir = os.path.join(root_dir, 'data')
    
    excel_files = [
        ('2020 batch.xls', 'Batch 2020', 2020),
        ('2021 batch.xls', 'Batch 2021', 2021),
        ('2022 batch.xls', 'Batch 2022', 2022)
    ]
    
    students_list = []
    seen_ids = set()
    seen_emails = set()
    
    for filename, batch_name, admission_yr in excel_files:
        filepath = os.path.join(data_dir, filename)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue
            
        df_batch = pd.read_excel(filepath)
        print(f"Reading {filename}: {len(df_batch)} rows")
        
        for idx, row in df_batch.iterrows():
            name = str(row.get('Student Name', '')).strip().title()
            if not name or name.lower() == 'nan':
                continue
                
            enrolment = str(row.get('Enrolment No.', '')).strip()
            if not enrolment or enrolment.lower() == 'nan':
                scholar_id = str(row.get('Scholar ID', '')).strip()
                if scholar_id and scholar_id.lower() != 'nan':
                    enrolment = f"SAGE{admission_yr}_{scholar_id}"
                else:
                    enrolment = f"SAGE{admission_yr}_{idx+1:04d}"
                    
            # Ensure unique primary key
            if enrolment in seen_ids:
                enrolment = f"{enrolment}_{idx+1}"
            seen_ids.add(enrolment)
            
            scholar_no = str(row.get('Scholar No.', '')).strip()
            if not scholar_no or scholar_no.lower() == 'nan':
                scholar_no = None

            scholar_id = str(row.get('Scholar ID', '')).strip()
            if not scholar_id or scholar_id.lower() == 'nan':
                scholar_id = None

            email = str(row.get('Email ID', '')).strip().lower()
            if not email or email.lower() == 'nan' or email in seen_emails:
                clean_name = name.lower().replace(" ", ".")
                email = f"{clean_name}.{idx+1}@sageuniversity.edu.in"
            seen_emails.add(email)
                
            class_sec = str(row.get('Class/Section', '')).strip()
            gender = str(row.get('Gender', 'Male')).strip()
            dob = str(row.get('Date Of Birth', '')).strip()
            mobile = str(row.get('Mobile', '')).strip()
            father = str(row.get('Father Name', '')).strip().title()
            mother = str(row.get('Mother Name', '')).strip().title()
            address = str(row.get('Address', '')).strip()
            blood_group = str(row.get('Blood Group', '')).strip()
            
            # Determine branch & program from Class/Section
            program = "B.Tech"
            branch = "CSE"
            if "M.Tech" in class_sec or "M Tech" in class_sec:
                program = "M.Tech"
            elif "BCA" in class_sec:
                program = "BCA"
            elif "MCA" in class_sec:
                program = "MCA"
                
            if "Cyber Security" in class_sec or "CSF" in class_sec:
                branch = "Cyber Security"
            elif "Data Science" in class_sec or "DSC" in class_sec:
                branch = "Data Science"
            elif "AI" in class_sec or "Artificial Intelligence" in class_sec:
                branch = "AI & ML"
            elif "CSE" in class_sec or "Computer Science" in class_sec:
                branch = "CSE"

            # Deterministic pseudo-random generation based on index/name hash for reproducibility
            rng = random.Random(hash(enrolment))
            
            pre_score = round(rng.uniform(55.0, 85.0), 1)
            post_score = min(100.0, round(pre_score + rng.uniform(8.0, 22.0), 1))
            
            pre_comm = round(rng.uniform(3.0, 4.2), 1)
            post_comm = min(5.0, round(pre_comm + rng.uniform(0.5, 1.2), 1))
            
            pre_eng = round(rng.uniform(3.0, 4.0), 1)
            post_eng = min(5.0, round(pre_eng + rng.uniform(0.6, 1.3), 1))
            
            pre_subj = round(rng.uniform(3.2, 4.2), 1)
            post_subj = min(5.0, round(pre_subj + rng.uniform(0.5, 1.1), 1))
            
            pre_conf = round(rng.uniform(3.0, 4.1), 1)
            post_conf = min(5.0, round(pre_conf + rng.uniform(0.6, 1.2), 1))
            
            pre_fluency = round(rng.uniform(3.1, 4.1), 1)
            post_fluency = min(5.0, round(pre_fluency + rng.uniform(0.5, 1.1), 1))
            
            dsa = rng.randint(65, 98)
            ml = rng.randint(60, 95)
            qa = rng.randint(62, 96)
            projects = rng.randint(70, 99)
            mock = rng.randint(65, 95)
            attendance = rng.randint(75, 98)
            
            prs_score = round((dsa * 0.25) + (ml * 0.20) + (qa * 0.15) + (projects * 0.20) + (mock * 0.20), 1)
            cgpa = round(min(10.0, 6.0 + (prs_score / 25.0) + rng.uniform(-0.3, 0.4)), 2)
            
            rag_status = "Green" if prs_score >= 80 else ("Yellow" if prs_score >= 68 else "Red")
            
            students_list.append({
                'student_id': enrolment,
                'enrollment_no': enrolment,
                'scholar_no': scholar_no,
                'scholar_id': scholar_id,
                'name': name,
                'email': email,
                'identity_proof': f"AADHAR-{rng.randint(100000000000, 999999999999)}",
                'batch_id': batch_name,
                'program': program,
                'branch': branch,
                'class_section': class_sec,
                'gender': gender,
                'dob': dob,
                'mobile': mobile,
                'father_name': father,
                'mother_name': mother,
                'address': address,
                'blood_group': blood_group,
                'start_date': '2025-01-15',
                'end_date': '2025-06-30',
                'pre_remarks': 'Good foundational concepts; scope for enhancement in advanced problem solving.',
                'pre_status': 'Completed',
                'post_remarks': 'Exhibited significant technical growth, strong logical fluency and coding aptitude.',
                'post_status': 'Completed',
                'pre_score': pre_score,
                'post_score': post_score,
                'pre_communication': pre_comm,
                'post_communication': post_comm,
                'pre_engagement': pre_eng,
                'post_engagement': post_eng,
                'pre_subject_knowledge': pre_subj,
                'post_subject_knowledge': post_subj,
                'pre_confidence': pre_conf,
                'post_confidence': post_conf,
                'pre_fluency': pre_fluency,
                'post_fluency': post_fluency,
                'external_certifications': rng.randint(1, 5),
                'active_backlogs': 0 if prs_score > 70 else rng.randint(0, 2),
                'dsa_score': dsa,
                'ml_score': ml,
                'qa_score': qa,
                'projects_score': projects,
                'mock_interview_score': mock,
                'attendance': attendance,
                'prs_score': prs_score,
                'cgpa': cgpa,
                'rag_status': rag_status
            })
            
    print(f"Total processed real students: {len(students_list)}")
    
    # Save full JSON to data/real_students_full.json
    json_path = os.path.join(data_dir, 'real_students_full.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(students_list, f, indent=2)
    print(f"Saved real students JSON to {json_path}")

    # Build student_teacher_test_data.xlsx sheets
    
    # 1. Sheet: students
    df_students = pd.DataFrame([{
        'student_id': s['student_id'],
        'name': s['name'],
        'email': s['email'],
        'identity_proof': s['identity_proof'],
        'batch_id': s['batch_id'],
        'start_date': s['start_date'],
        'end_date': s['end_date'],
        'pre_remarks': s['pre_remarks'],
        'pre_status': s['pre_status'],
        'post_remarks': s['post_remarks'],
        'post_status': s['post_status'],
        'pre_score': s['pre_score'],
        'post_score': s['post_score'],
        'pre_communication': s['pre_communication'],
        'post_communication': s['post_communication'],
        'pre_engagement': s['pre_engagement'],
        'post_engagement': s['post_engagement'],
        'pre_subject_knowledge': s['pre_subject_knowledge'],
        'post_subject_knowledge': s['post_subject_knowledge'],
        'pre_confidence': s['pre_confidence'],
        'post_confidence': s['post_confidence'],
        'pre_fluency': s['pre_fluency'],
        'post_fluency': s['post_fluency'],
        'external_certifications': s['external_certifications'],
        'active_backlogs': s['active_backlogs']
    } for s in students_list])
    
    # 2. Sheet: teachers
    df_teachers = pd.DataFrame([
        {'teacher_id': 'TCH001', 'name': 'Dr. Rahul Mehta', 'email': 'rahul.mehta@sage.com', 'department': 'Computer Science & AI', 'subjects': 'Python, Data Structures'},
        {'teacher_id': 'TCH002', 'name': 'Ms. Neha Kapoor', 'email': 'neha.kapoor@sage.com', 'department': 'Computer Science & AI', 'subjects': 'DBMS, Machine Learning'},
        {'teacher_id': 'TCH003', 'name': 'Dr. Amit Trivedi', 'email': 'amit.trivedi@sage.com', 'department': 'Cyber Security', 'subjects': 'Ethical Hacking, Network Security'}
    ])
    
    # 3. Sheet: tests
    df_tests = pd.DataFrame([
        {'test_id': 'TEST001', 'title': 'Python & DSA Fundamentals Test', 'subject': 'Data Structures', 'type': 'Quiz', 'total_questions': 10, 'total_marks': 100, 'created_by': 'TCH001'},
        {'test_id': 'TEST002', 'title': 'DBMS & SQL Comprehensive Assessment', 'subject': 'DBMS', 'type': 'Mid-Term', 'total_questions': 10, 'total_marks': 100, 'created_by': 'TCH002'},
        {'test_id': 'TEST003', 'title': 'Machine Learning & Predictive Models', 'subject': 'Machine Learning', 'type': 'Final', 'total_questions': 10, 'total_marks': 100, 'created_by': 'TCH002'}
    ])
    
    # 4. Sheet: questions
    df_questions = pd.DataFrame([
        {'question_id': 'Q001', 'test_id': 'TEST001', 'question_type': 'MCQ', 'topic': 'Python Basics', 'question_text': 'Which keyword is used for function declaration in Python?', 'correct_answer': 'def', 'marks': 10},
        {'question_id': 'Q002', 'test_id': 'TEST001', 'question_type': 'MCQ', 'topic': 'OOP', 'question_text': 'What OOP concept allows a class to inherit properties from another?', 'correct_answer': 'Inheritance', 'marks': 10},
        {'question_id': 'Q003', 'test_id': 'TEST002', 'question_type': 'MCQ', 'topic': 'SQL', 'question_text': 'Which SQL command is used to query data from a table?', 'correct_answer': 'SELECT', 'marks': 10},
        {'question_id': 'Q004', 'test_id': 'TEST003', 'question_type': 'MCQ', 'topic': 'ML', 'question_text': 'Which algorithm is commonly used for classification?', 'correct_answer': 'Random Forest', 'marks': 10}
    ])
    
    # 5. Sheet: test_assignments
    test_assignments = []
    asg_id = 1
    for s in students_list:
        for t in ['TEST001', 'TEST002', 'TEST003']:
            test_assignments.append({
                'assignment_id': f"ASG{asg_id:04d}",
                'test_id': t,
                'student_id': s['student_id'],
                'assigned_by': 'TCH001' if t == 'TEST001' else 'TCH002',
                'status': 'Completed'
            })
            asg_id += 1
    df_test_assignments = pd.DataFrame(test_assignments)
    
    # 6. Sheet: test_attempts
    test_attempts = []
    att_id = 1
    for asg in test_assignments:
        s_id = asg['student_id']
        t_id = asg['test_id']
        rng = random.Random(hash(s_id + t_id))
        score = rng.randint(65, 98)
        test_attempts.append({
            'attempt_id': f"ATT{att_id:04d}",
            'assignment_id': asg['assignment_id'],
            'student_id': s_id,
            'test_id': t_id,
            'score': score,
            'total_marks': 100,
            'accuracy': score,
            'time_taken_minutes': rng.randint(12, 45)
        })
        att_id += 1
    df_test_attempts = pd.DataFrame(test_attempts)
    
    # 7. Sheet: student_answers
    student_answers = []
    ans_id = 1
    for att in test_attempts:
        s_id = att['student_id']
        t_id = att['test_id']
        q_list = [q for q in df_questions.to_dict('records') if q['test_id'] == t_id]
        for q in q_list:
            is_correct = att['score'] > 70
            student_answers.append({
                'answer_id': f"ANS{ans_id:05d}",
                'attempt_id': att['attempt_id'],
                'question_id': q['question_id'],
                'student_id': s_id,
                'student_answer': q['correct_answer'] if is_correct else "Incorrect Answer",
                'is_correct': is_correct,
                'marks_awarded': q['marks'] if is_correct else 0
            })
            ans_id += 1
    df_student_answers = pd.DataFrame(student_answers)
    
    # 8. Sheet: student_topic_performance
    topic_perf = []
    tp_id = 1
    topics = ['Python Basics', 'Data Structures', 'OOP', 'SQL & Databases', 'Machine Learning']
    for s in students_list:
        rng = random.Random(hash(s['student_id']))
        for topic in topics:
            acc = rng.randint(60, 98)
            rating = "Excellent" if acc >= 85 else ("Good" if acc >= 72 else "Needs Improvement")
            topic_perf.append({
                'performance_id': f"TP{tp_id:04d}",
                'student_id': s['student_id'],
                'topic': topic,
                'accuracy': acc,
                'rating': rating
            })
            tp_id += 1
    df_topic_perf = pd.DataFrame(topic_perf)
    
    # 9. Sheet: academic_grades
    academic_grades = []
    gr_id = 1
    courses = ['Python', 'DBMS', 'Data Structures', 'Machine Learning']
    for s in students_list:
        rng = random.Random(hash(s['student_id']))
        for course in courses:
            academic_grades.append({
                'grade_id': f"GR{gr_id:04d}",
                'student_id': s['student_id'],
                'course': course,
                'mid_sem': rng.randint(65, 95),
                'end_sem': rng.randint(68, 98),
                'internal': rng.randint(70, 96)
            })
            gr_id += 1
    df_academic_grades = pd.DataFrame(academic_grades)
    
    # 10. Sheet: attendance_logs
    attendance_logs = []
    att_log_id = 1
    dates = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-17']
    for s in students_list:
        rng = random.Random(hash(s['student_id']))
        for dt in dates:
            stat = "Present" if rng.random() < 0.90 else "Absent"
            attendance_logs.append({
                'log_id': f"ATTLOG{att_log_id:05d}",
                'student_id': s['student_id'],
                'course': 'General CSE',
                'date': dt,
                'status': stat
            })
            att_log_id += 1
    df_attendance_logs = pd.DataFrame(attendance_logs)
    
    # 11. Sheet: rag_logs
    rag_logs = []
    rag_id = 1
    for s in students_list:
        risk_level = s['rag_status']
        risk_score = 100 - int(s['prs_score'])
        reason = "Consistent high performance across tests and attendance." if risk_level == "Green" else ("Performance requires periodic monitoring." if risk_level == "Yellow" else "Low attendance and test accuracy detected.")
        rag_logs.append({
            'rag_id': f"RAG{rag_id:04d}",
            'student_id': s['student_id'],
            'week_start': '2026-08-10',
            'risk_level': risk_level,
            'risk_score': risk_score,
            'reason': reason
        })
        rag_id += 1
    df_rag_logs = pd.DataFrame(rag_logs)
    
    # Write to student_teacher_test_data.xlsx
    excel_out_path = os.path.join(root_dir, 'student_teacher_test_data.xlsx')
    with pd.ExcelWriter(excel_out_path, engine='openpyxl') as writer:
        df_students.to_excel(writer, sheet_name='students', index=False)
        df_teachers.to_excel(writer, sheet_name='teachers', index=False)
        df_tests.to_excel(writer, sheet_name='tests', index=False)
        df_questions.to_excel(writer, sheet_name='questions', index=False)
        df_test_assignments.to_excel(writer, sheet_name='test_assignments', index=False)
        df_test_attempts.to_excel(writer, sheet_name='test_attempts', index=False)
        df_student_answers.to_excel(writer, sheet_name='student_answers', index=False)
        df_topic_perf.to_excel(writer, sheet_name='student_topic_performance', index=False)
        df_academic_grades.to_excel(writer, sheet_name='academic_grades', index=False)
        df_attendance_logs.to_excel(writer, sheet_name='attendance_logs', index=False)
        df_rag_logs.to_excel(writer, sheet_name='rag_logs', index=False)
        
    print(f"Successfully generated updated {excel_out_path} with {len(df_students)} real students!")

if __name__ == '__main__':
    generate_real_student_data()
