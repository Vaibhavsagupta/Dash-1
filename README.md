# Role-Based Analytics Dashboard

A comprehensive dashboard system for educational institutions to track Student Placement Readiness and Teacher Effectiveness.

## 🚀 Quick Start Guide

### Prerequisites
- **Python** (3.9+)
- **Node.js** (18+)
- **npm** (9+)

### ⚡ One-Click Start (Windows)
We have included a script to launch everything automatically.
1. Double-click **`run_dashboard.bat`** in the main folder.
2. It will open the backend, frontend, and your browser automatically.

*Alternatively, follow the manual steps below:*

### 1. Backend Setup (FastAPI)
The backend handles authentication, analytics logic, and database management.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows:
.\venv\Scripts\Activate
# Mac/Linux:
# source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Initialize & Seed Database (Creates users and mock data)
python seed.py

# 6. Start the Server
uvicorn app.main:app --reload
```
*The backend runs on `http://localhost:8000`*

### 2. Frontend Setup (Next.js)
The frontend provides the responsive user interface.

```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Development Server
npm run dev
```
*The frontend runs on `http://localhost:3000`*

---

## 🔐 Login Credentials
(Use these precise credentials to access the different roles)

### **Admin** (Full Access)
- **Email**: `admin@example.com`
- **Password**: `admin`
- **Access**: Global Analytics, Manage Student Data, Teacher Performance, Add New Students.

### **Teachers** (Faculty Access)
- **Demo Teacher**: `teacher@example.com`
- **Password**: `password`
- **Access**: Personal Effectiveness Score (TEI), Daily Lectures, Class Management.

### **Students** (Personal View)
- Credentials follow a standard pattern based on Student ID.
- **Email**: `[Student_ID]@university.edu` (e.g. `S01@university.edu`, `BROWSER_ADD@university.edu`)
- **Password**: `[Student_ID]` (e.g. `S01`, `BROWSER_ADD`)
- **Note**: New students added via the admin panel are automatically assigned these credentials.
- **Access**: View Personal Readiness Score (PRS), Attendance, and Assignments.

---

## 🌟 Key Features

### 1. **Automated Analytics Engine**
- **PRS (Placement Readiness Score)**: auto-calculated from Attendance, DSA, ML, QA, Projects, and Mock Interview scores.
- **TEI (Teacher Effectiveness Index)**: auto-calculated from Student Improvement, Feedback, Quality, and Placement Conversion.

### 2. **Data Management Center**
*Available for Admins and Teachers at `/admin/manage` or `/teacher/manage`*
- **Manual Entry**: Edit individual student scores directly in the UI.
- **Add New Student**: Create new student records instantly.
- **Bulk Upload**: Upload a CSV file to update hundreds of students at once.
    - **CSV Format**: `Student_ID, Attendance, DSA, ML, QA, Projects, Mock`
    - *Example*: `S99, 85, 90, 88, 75, 4, 80`
