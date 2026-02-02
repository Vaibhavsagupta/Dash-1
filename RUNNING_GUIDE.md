# 🚀 Project Setup & Running Guide

This guide details the steps to set up and run the Dashboard project locally on Windows.

## ✅ Prerequisites

Ensure you have the following installed:
*   **Python** (3.9 or higher)
*   **Node.js** (18 or higher)
*   **npm** (comes with Node.js)

---

## 🛠️ Step 1: Backend Setup (FastAPI & PostgreSQL)

The backend handles the database, authentication, and analytics logic. It is now powered by **PostgreSQL** for production stability.

1.  **Open a terminal** and navigate to the project root.
2.  **Navigate to the backend directory**:
    ```powershell
    cd backend
    ```
3.  **Configure Environment Variables**:
    *   Rename `.env.example` to `.env`.
    *   Update `DATABASE_URL` with your Supabase connection string or local PostgreSQL URL.
4.  **Create and Activate virtual environment**:
    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate
    ```
5.  **Install dependencies**:
    ```powershell
    pip install -r requirements.txt
    ```
6.  **Initialize the Database**:
    *This will create tables and seed your cloud database with real student data.*
    ```powershell
    python seed.py
    ```
7.  **Run the server**:
    ```powershell
    uvicorn app.main:app --reload --port 7000
    ```
    *The backend will start at `http://127.0.0.1:7000`*


---

## 🎨 Step 2: Frontend Setup (Next.js)

The frontend handles the user interface.

1.  **Open a NEW terminal window** (do not close the backend terminal).
2.  **Navigate to the frontend directory**:
    ```powershell
    cd frontend
    ```
3.  **Install dependencies**:
    ```powershell
    npm install
    ```
4.  **Run the development server**:
    ```powershell
    npm run dev
    ```
    *The frontend will start at `http://127.0.0.1:5173`*

---

## 🌐 Step 3: Accessing the Dashboard

Open your web browser and navigate to:
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

---

## 🛠️ Troubleshooting: "Failed to Fetch"

If you see a "Failed to fetch" error on the login or signup page:

1.  **Use 127.0.0.1**: Always access the site via `http://127.0.0.1:5173` instead of `localhost:5173`.
2.  **Restart Frontend**: If you changed `.env.local`, you **MUST** stop the frontend (`Ctrl+C`) and run `npm run dev` again.
3.  **Hard Refresh**: Press `Ctrl + F5` in your browser to clear the cache.
4.  **Check Backend**: Ensure the backend terminal shows "Uvicorn running on http://127.0.0.1:7000".

---

## 🔐 Login Credentials

Use these credentials to log in to different roles.

### **Admin** (Full Access)
*   **Email**: `admin@example.com`
*   **Password**: `admin`

### **Teacher** (Faculty View)
*   **Email**: `teacher@example.com`
*   **Password**: `password`
*   *Alternative*: `t01@school.com` / `T01`

### **Student** (Student View)
*   **Email**: Use any email from `Student data/student batch info.csv.xlsx` (e.g., `Abhaypratapsingh010107@gmail.com`)
*   **Password**: `password123`
*   *Note*: All previous sample students (s001-s030) have been removed.