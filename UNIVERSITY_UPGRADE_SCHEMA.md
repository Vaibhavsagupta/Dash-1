# University Upgrade Schema & Database Parameters

This document outlines the database schema transition, parameters, and CSV formatting guidelines for upgrading the Role-Based Analytics Dashboard from a bootcamp/training structure (Batches, Pre/Post Observations) to a formal **University-level structure** (Programs, Branches, Semesters, Sections, CGPA, and Course Codes).

---

## 🔄 Summary of Structural Changes

| Feature / Metric | Bootcamp (Current) | University (Upgraded) |
| :--- | :--- | :--- |
| **Cohort Grouping** | `batch_id` (e.g., Batch 1, Batch 2) | Combined `program`, `branch`, `semester`, and `section` |
| **Student ID** | `student_id` (e.g., S01, S02) | `enrollment_no` (e.g., 0936CS221001) |
| **Performance Metric** | `pre_score`, `post_score` | `cgpa` (Cumulative Grade Point Average) |
| **Detailed Progressions** | Specific Pre/Post communication, fluency, confidence, etc. | Course-wise grades, marks (`mid_sem_marks`, `end_sem_marks`, `internal_marks`) |
| **Subjects/Curriculum** | Fixed subjects (DSA, ML, QA) | Dynamic `courses` with credits and codes (e.g., CS-401, MCA-102) |
| **Attendance Logging** | Day-index matrix columns per student | Daily date-wise and course-wise attendance logs |
| **Performance Index** | TEI based on general placement & student progression | Dynamic feedback per teacher per allocated course |

---

## 🗄️ Database Tables & Parameters (Upgraded)

### 1. Student Table (`students`)
Stores the main student profile data.

*   `enrollment_no` (String, Primary Key) - *Unique identifier (e.g., `0936CS221001`)*
*   `name` (String, Required) - *Full name of the student*
*   `email` (String, Unique, Required) - *University email address*
*   `program` (String, Required) - *Degree program (e.g., `B.Tech`, `M.Tech`, `BCA`, `MCA`, `MBA`)*
*   `branch` (String, Required) - *Department/Branch of study (e.g., `CSE`, `IT`, `ECE`, `ME`)*
*   `semester` (Integer, Required) - *Current semester (e.g., `1` to `8`)*
*   `section` (String, Required) - *Class Section (e.g., `A`, `B`, `C`)*
*   `cgpa` (Float, Default: `0.0`) - *Cumulative Grade Point Average (out of 10.0)*
*   `active_backlogs` (Integer, Default: `0`) - *Count of active backlog papers*
*   `admission_year` (Integer) - *Year student was admitted (e.g., `2022`)*
*   `graduation_year` (Integer) - *Expected graduation year (e.g., `2026`)*
*   `identity_proof` (String) - *Aadhar Card, PAN, or Passport number*
*   `placement_status` (String, Default: `Eligible`) - *Values: `Eligible`, `Placed`, `Not Placed`, `Opted Out`*

---

### 2. Teacher/Faculty Table (`teachers`)
Stores professor and faculty profile data.

*   `faculty_id` (String, Primary Key) - *Unique Faculty Code (e.g., `FAC101`)*
*   `name` (String, Required) - *Name of the faculty member*
*   `email` (String, Unique, Required) - *Official university email address*
*   `department` (String, Required) - *Associated department (e.g., `Computer Science & Engineering`)*
*   `designation` (String) - *Title (e.g., `Assistant Professor`, `Associate Professor`, `Professor`, `HOD`)*
*   `teaching_experience` (Integer) - *Years of teaching experience*
*   `feedback_score` (Float, Default: `5.0`) - *Average student feedback rating (out of 5.0)*

---

### 3. Course/Subject Table (`courses`)
Defines the subjects taught within the university.

*   `course_code` (String, Primary Key) - *Unique Course Code (e.g., `CS-401`, `MCA-102`)*
*   `course_name` (String, Required) - *Full subject title (e.g., `Database Management Systems`)*
*   `department` (String, Required) - *Associated department (e.g., `CSE`)*
*   `credits` (Integer, Required) - *Academic credit weight of the course (e.g., `3`, `4`)*
*   `semester` (Integer, Required) - *The semester this course is offered in (e.g., `4`)*

---

### 4. Course Allocation Table (`course_allocations`)
Maps teachers to the specific courses, semesters, and sections they are currently teaching.

*   `allocation_id` (String, Primary Key) - *Unique Allocation UUID*
*   `course_code` (String, Foreign Key -> `courses.course_code`)
*   `faculty_id` (String, Foreign Key -> `teachers.faculty_id`)
*   `semester` (Integer) - *e.g., `4`*
*   `section` (String) - *e.g., `A`*
*   `academic_year` (String) - *e.g., `2025-26`*

---

### 5. Academic Performance/Grades Table (`academic_grades`)
Tracks student performance across courses.

*   `grade_id` (String, Primary Key) - *Unique grade entry UUID*
*   `enrollment_no` (String, Foreign Key -> `students.enrollment_no`)
*   `course_code` (String, Foreign Key -> `courses.course_code`)
*   `mid_sem_marks` (Float, Default: `0.0`) - *Mid-semester marks (out of 30)*
*   `end_sem_marks` (Float, Default: `0.0`) - *End-semester marks (out of 70)*
*   `internal_marks` (Float, Default: `0.0`) - *Assignment, Quizzes, Lab, and Attendance marks (out of 20)*
*   `total_marks` (Float) - *Sum of mid-sem, end-sem, and internal marks*
*   `grade_obtained` (String) - *Letter Grade (e.g., `O` (Outstanding), `A+`, `A`, `B+`, `B`, `C`, `P`, `F` (Fail))*

---

### 6. Attendance Log Table (`attendance_logs`)
Replaces spreadsheet day-matrix columns with dynamic date-wise and course-wise logging.

*   `log_id` (String, Primary Key) - *Unique log entry UUID*
*   `enrollment_no` (String, Foreign Key -> `students.enrollment_no`)
*   `course_code` (String, Foreign Key -> `courses.course_code`)
*   `date` (Date) - *The date of the class lecture*
*   `status` (String) - *Values: `Present`, `Absent`, `Medical Leave`*

---

### 7. Placement Readiness Score Table (`placement_readiness` - Optional)
If the dashboard needs to maintain a separate tab for T&P (Training & Placement) cell readiness metric tracking:

*   `enrollment_no` (String, Foreign Key -> `students.enrollment_no`, Primary Key)
*   `dsa_score` (Float) - *Data Structures score (out of 100)*
*   `aptitude_score` (Float) - *Aptitude/Quantitative/Reasoning score (out of 100)*
*   `communication_score` (Float) - *Communication skills and GD score (out of 100)*
*   `projects_score` (Float) - *Project quality check score (out of 100)*
*   `mock_interview_score` (Float) - *Average score in mock technical/HR rounds (out of 100)*

---

### 8. Teacher Effectiveness Index (TEI) Feedback Table (`faculty_feedback`)
Used to calculate teacher ratings dynamically.

*   `feedback_id` (String, Primary Key) - *Unique feedback entry UUID*
*   `faculty_id` (String, Foreign Key -> `teachers.faculty_id`)
*   `course_code` (String, Foreign Key -> `courses.course_code`)
*   `rating_subject_knowledge` (Integer) - *Rating between 1 and 5*
*   `rating_communication` (Integer) - *Rating between 1 and 5*
*   `rating_punctuality` (Integer) - *Rating between 1 and 5*
*   `rating_overall` (Integer) - *Rating between 1 and 5*
*   `comments` (Text) - *Written student feedback*

---

## 📈 Standard CSV / Excel Templates for Data Ingestion

To support bulk uploads, the backend should expect spreadsheets with the following headers:

### Template A: `Student Master List`
| S.No | Enrollment No | Name | Email | Program | Branch | Semester | Section | CGPA | Active Backlogs | Identity Proof | Start Date | End Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 0936CS221001 | Abhay Pratap | abhay@univ.edu | B.Tech | CSE | 5 | A | 8.4 | 0 | 123456789012 | 2025-07-07 | 2025-12-20 |

### Template B: `Course Marks / Academic Performance`
| Enrollment No | Course Code | Mid-Sem Marks (30) | End-Sem Marks (70) | Internals (20) | Grade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0936CS221001 | CS-401 | 24.5 | 55.0 | 18.0 | A+ |
| 0936CS221002 | CS-401 | 18.0 | 45.5 | 15.0 | B |

### Template C: `Attendance Log`
| Enrollment No | Course Code | Date | Status |
| :--- | :--- | :--- | :--- |
| 0936CS221001 | CS-401 | 2025-02-01 | Present |
| 0936CS221002 | CS-401 | 2025-02-01 | Absent |
