# 🚀 Render Deployment Guide (All-in-One Blueprint)

This guide explains how to deploy the entire **SAGE AI Institutional Analytics & Dashboard System** (PostgreSQL + FastAPI Backend + Next.js Frontend) to **Render** using 1-click Render Blueprint.

---

## 📋 Prerequisites
1. A **GitHub Account** with this repository pushed to your profile.
2. A free **Render Account** ([render.com](https://render.com)).

---

## 🛠️ Step 1: Git Push local changes

Open terminal in project directory and run:

```bash
git add .
git commit -m "Setup Render Blueprint deployment configuration"
git push origin main
```

---

## 🌐 Step 2: Deploy on Render via Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click the **New +** button in top right and select **Blueprint**.
3. Connect your GitHub account (if not connected) and select your project repository (`Dash-1` / `Dashboard-2`).
4. Give a **Service Group Name** (e.g., `sage-dashboard-stack`).
5. Render will automatically detect `render.yaml` and show:
   - 🗄️ **dash-1-db** (PostgreSQL Database)
   - ⚡ **dash-1-backend** (Python FastAPI Service)
   - 💻 **dash-1-frontend** (Next.js Node.js Web Service)
6. Click **Apply**.

---

## ⏱️ Step 3: Automatic Build & Database Seeding

Render will build and deploy each component automatically:
1. **Database**: Render provisions PostgreSQL.
2. **Backend**: Render installs Python requirements and starts Uvicorn. Upon startup, FastAPI runs `auto_init_database()`, creating all database tables and seeding default admin, teacher, and student credentials.
3. **Frontend**: Next.js app builds and connects to your live FastAPI backend service automatically via `$NEXT_PUBLIC_API_URL`.

---

## 🔑 Pre-seeded Test Accounts

Once deployment is live, you can log into your live frontend URL with:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@sage.com` | `password` |
| **Teacher** | `teacher@sage.com` | `password` |
| **Student** | `vaibhav@sage.com` | `password` |

---

## 🔗 Environment Variables Reference (Auto-configured by Blueprint)

- `DATABASE_URL`: Automatically linked from `dash-1-db` to `dash-1-backend`.
- `FRONTEND_URL`: Automatically linked from `dash-1-frontend` to `dash-1-backend` for CORS.
- `NEXT_PUBLIC_API_URL`: Automatically linked from `dash-1-backend` to `dash-1-frontend`.
