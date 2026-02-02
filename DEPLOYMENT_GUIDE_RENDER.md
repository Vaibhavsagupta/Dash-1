# Backend Deployment Guide (Render.com)

Since your project is structured with the backend in a subfolder, follow these steps to deploy your FastAPI backend on **Render**.

---

## 1. Create a New Web Service
1. Go to [Render.com](https://render.com/) and log in.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `gitvai/dash`.

## 2. Configure Service Settings
When configuring the service, use the following settings:

*   **Name**: `student-dashboard-api` (or your preferred name)
*   **Region**: Select the one closest to you (e.g., Singapore or US East)
*   **Branch**: `main`
*   **Root Directory**: `backend` (CRITICAL: This tells Render to look inside the backend folder)
*   **Runtime**: `Python 3`
*   **Build Command**: `pip install -r requirements.txt`
*   **Start Command**: `gunicorn -k uvicorn.workers.UvicornWorker app.main:app`

## 3. Environment Variables
Click on the **Environment** tab and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.10.0` (or your local version) | Ensures compatibility |
| `SECRET_KEY` | `your-random-secret-key-here` | For JWT authentication |
| `ALGORITHM` | `HS256` | JWT Algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Session timeout |
| `FRONTEND_URL` | `https://your-frontend-domain.vercel.app` | **Add this after deploying frontend** |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | **REQUIRED** - PostgreSQL connection string (use Supabase or Render PostgreSQL) |

## 4. Database Setup (PostgreSQL Required)
This application requires **PostgreSQL**. You have two options:

### Option A: Use Supabase (Recommended)
1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Get your connection string from Project Settings → Database
4. Add it to Render's `DATABASE_URL` environment variable

### Option B: Use Render PostgreSQL
1. In Render dashboard, click **New +** → **PostgreSQL**
2. Create a new PostgreSQL database
3. Copy the **Internal Database URL**
4. Add it to your web service's `DATABASE_URL` environment variable

---

## 5. Deployment Verification
Once Render shows "Live", you can verify by visiting:
`https://your-service-name.onrender.com/`

You should see: `{"message": "Welcome to the Dashboard API"}`

### Next Steps:
1. Update the `API_BASE_URL` in your frontend code to point to this Render URL.
2. Deploy the frontend on **Vercel**.
