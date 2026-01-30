# TP Dashboard Backend

A powerful, dynamic, and agentic backend for the Training & Placement (TP) Dashboard. Built with **FastAPI**, **Pandas**, and **SQLite**, it provides real-time analytics, dynamic CSV ingestion, and RAG-based insights.

## 🚀 Features

### 1. **Universal Data Ingestion**
   - **Upload Any CSV**: Automatically detects schema and structure.
   - **Dynamic Tables**: Creates database tables on the fly for every new upload.
   - **Version Control**: Tracks upload history, row counts, and detailed metadata.
   - **Smart Validation**: Handles missing values, sanitizes headers, and prevents bad data entry.

### 2. **Advanced Analytics Engines**
   - **Attendance Engine**: Calculates row-wise attendance %, identifies "Low Attendance" risks (<75%).
   - **Assessment Engine**: Computes subject averages, class rank, and top performers.
   - **RAG Engine**: Categorizes students into Red/Amber/Green zones based on performance.
   - **Observation Engine**: Compares Pre vs. Post observation data to measure student growth (Delta analysis).

### 3. **Deep-Dive Insights**
   - **Student Profile**: Single endpoint (`/analytics/student/{id}`) aggregates data from all modules (Attendance, Marks, Growth, RAG) for a 360° view.
   - **Batch Overview**: Admin-level dashboard summarizing overall batch health and key metrics.

### 4. **Production Ready**
   - **Performance**: Indexed database columns and response time tracking.
   - **Robustness**: Global exception handling and health checks.
   - **Listing**: Transparent API to list all uploaded datasets.

---

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.10+
- Git

### 1. Clone & Navigate
```bash
git clone <repo-url>
cd tp-dashboard-backend
```

### 2. Environment Setup
Create a virtual environment:
```bash
python -m venv .venv
# Activate:
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Verify Database
Initialize the database (System tables):
```bash
python scripts/init_db.py
```

---

## 🏃 Running the Server

**Option A: Quick Start (Windows)**
Double-click `run_backend.bat` or run:
```cmd
run_backend.bat
```

**Option B: Manual Start**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server will be available at: `http://localhost:8000`

---

## 📚 API Documentation

Interactive Swagger docs are available at: `http://localhost:8000/docs`

### Key Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Ingestion** | `POST` | `/ingest/csv` | Upload a CSV file (Form: `file`, `dataset_type`). |
| **Dashboard** | `GET` | `/dashboard/summary` | System health and stats. |
| | `GET` | `/dashboard/datasets` | List all uploaded files. |
| **Analytics** | `GET` | `/analytics/attendance` | Average %, Low attendance list. |
| | `GET` | `/analytics/assessment` | Class avg, Top 5, Subject-wise stats. |
| | `GET` | `/analytics/rag` | Red/Amber/Green distribution. |
| | `GET` | `/analytics/observation` | Pre/Post growth analysis. |
| **Drill-Down**| `GET` | `/analytics/student/{id}`| Full profile for a specific student. |
| | `GET` | `/analytics/batch/overview`| High-level batch health score. |

---

## 📂 Project Structure

```
tp-dashboard-backend/
├── app/
│   ├── analytics/          # Logic engines (Attendance, RAG, etc.)
│   ├── core/               # Database & Configs
│   ├── ingestion/          # CSV Parser, Loader, Validator
│   ├── models/             # SQLAlchemy Models (System tables)
│   ├── routers/            # API Endpoints
│   └── main.py             # App Entrypoint
├── data/uploads/           # Raw CSV storage
├── scripts/                # Helper scripts (init_db, debug)
├── requirements.txt
├── run_backend.bat
└── test.db                 # SQLite Database
```

## 🔐 Configuration
- **.env**: (Optional) Configure `PROJECT_NAME`, `HOST`, `PORT`.
- **Database**: Uses SQLite by default (`test.db`).

---

**Developed by Google DeepMind Agentic Team**
