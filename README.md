# SAGE AI Institutional Analytics & Dashboard System

A state-of-the-art, full-stack educational dashboard and predictive analytics platform built for educational institutions to monitor **Student Placement Readiness**, **Teacher Effectiveness Index (TEI)**, **AI Academic Risk Detection**, and **Batch Performance Analytics**.

---
ye raha ai csf and fad ka syllabus from sem 1 to sem 8 
mock data hta de and ye vala poora daalde 
ocurse id vagera sab hai isme 
poora integrate karde 

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ / 20+
- **PostgreSQL**: 14+ (Local or Cloud Supabase / Render)

---

### 1. Backend Setup (FastAPI & PostgreSQL)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate Python Virtual Environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Environment Variables Configuration
# Copy .env.example to .env and configure PostgreSQL connection string
# DATABASE_URL=postgresql://postgres:password@localhost:5432/database_db

# 5. Run FastAPI Server
uvicorn app.main:app --reload --port 7000
```
- **Backend Base URL**: `http://localhost:7000`
- **Interactive Swagger API Docs**: `http://localhost:7000/docs`

---

### 2. Frontend Setup (Next.js 16 & TailwindCSS)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start Next.js Development Server
npm run dev
```
- **Frontend App URL**: `http://localhost:3001`

---

## 🔐 System Access Credentials

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sage.com` | `password` | Full institutional access, student & teacher management, batch analytics. |
| **Teacher** | `teacher@sage.com` | `password` | Create tests, AI question generation, class engagement & scatter analysis. |
| **Faculty (CS)** | `rajesh.sharma@sage.com` | `password` | Faculty analytics & course grade management. |
| **Student** | `vaibhav@sage.com` | `password` | Personal readiness hub, 10 MVP visual graphs, test progress & AI score. |
| **Student** | `rohan.mehta@sage.com` | `password` | Personal analytics & academic records. |
| **Student** | `priya.sharma@sage.com` | `password` | Personal analytics & academic records. |

---

## 📊 Core Features & Visual Analytics Suite

### 1. **Student AI Performance Hub (10 Priority MVP Graphs)**
- **Overall Performance Trend**: Line chart comparing student scores vs class averages.
- **Subject-wise Performance**: Bar chart illustrating score distribution per subject.
- **Test Score Progress**: Sequential test performance tracking line chart.
- **Attempt-wise Performance**: Comparison across 1st, 2nd, and 3rd test retakes.
- **Topic-wise Accuracy**: Micro-level topic mastery progress indicators.
- **Difficulty-wise Accuracy**: Easy, Medium, and Hard question accuracy breakdown.
- **Question Type Performance**: Accuracy across MCQ, Fill-in-Blank, Coding, and Numerical questions.
- **Correct vs Incorrect vs Skipped**: Interactive donut chart.
- **AI Performance Score**: 0–100 composite health gauge meter.
- **AI Risk Score Trend & Prediction**: Multi-line actual vs AI predicted performance projection.

### 2. **Teacher & Admin Batch Analytics**
- **Attendance vs Performance Scatter Plot**: Core AI correlation graph plotting Attendance % against Average Marks %.
- **Student Ranking Leaderboard**: Filterable leaderboard with Branch & Semester controls.
- **Score Distribution Histogram**: Class frequency across mark brackets (0–40 to 90–100).

### 3. **AI Risk Engine (RAG Status)**
- Real-time **Red / Amber / Green** academic risk flagging based on attendance, backlogs, and mid-term grade thresholds.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, Chart.js (`react-chartjs-2`), Lucide Icons, Framer Motion, NextAuth.js.
- **Backend**: FastAPI, SQLAlchemy, Alembic Migrations, PostgreSQL (`psycopg2`), Uvicorn, Pandas.
- **Database**: PostgreSQL (`database_db`).
