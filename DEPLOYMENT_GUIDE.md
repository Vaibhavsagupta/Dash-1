# 🚀 Deployment Guide

This project is prepared for a seamless deployment using **Render** (Backend) and **Vercel** (Frontend).

## 🛠️ Step 1: Push Changes to GitHub

Ensure all your latest changes are pushed to your repository:

```powershell
git add .
git commit -m "Finalizing for deployment"
git push origin main
```

---

## 🖥️ Step 2: Deploy Backend (Render)

1.  **Sign in** to [Render.com](https://render.com/).
2.  Click **New +** > **Web Service**.
3.  Connect your GitHub repository (`dash`).
4.  Configure the following:
    *   **Name**: `dash-api`
    *   **Root Directory**: `backend`
    *   **Environment**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT`
5.  **Environment Variables**:
    *   Add `DATABASE_URL`: **REQUIRED** - PostgreSQL connection string (use Supabase or Render PostgreSQL).
    *   Add `FRONTEND_URL`: (Set this AFTER you get the Vercel link in Step 3).
6.  Click **Deploy Web Service**.

---

## 🎨 Step 3: Deploy Frontend (Vercel)

1.  **Sign in** to [Vercel.com](https://vercel.com/).
2.  Click **Add New** > **Project**.
3.  Import your GitHub repository (`dash`).
4.  Configure the following:
    *   **Framework Preset**: `Next.js`
    *   **Root Directory**: `frontend`
5.  **Environment Variables**:
    *   Add `NEXT_PUBLIC_API_URL`: (Set this to your **Render Web Service URL**, e.g., `https://dash-api.onrender.com`).
6.  Click **Deploy**.

---

## 🔗 Final Connection

Once the frontend is deployed:
1.  Copy your **Vercel URL** (e.g., `https://dash-frontend.vercel.app`).
2.  Go back to **Render Dashboard** > **Environment Variables**.
3.  Update (or add) `FRONTEND_URL` with your Vercel URL.
4.  Render will auto-redeploy to allow CORS from your new frontend.

---

## ✅ You're Live!
Your dashboard should now be accessible at your Vercel link.
