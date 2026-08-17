# 🚀 Deployment Guide: Vercel (Frontend) + Render (Backend) + PostgreSQL (Database)

This guide covers deploying the **SAGE AI System**:
- **Frontend**: Vercel (Next.js 16)
- **Backend**: Render Web Service (FastAPI Python)
- **Database**: PostgreSQL (Render PostgreSQL / Neon / Supabase)

---

## 🗄️ Step 1: Create PostgreSQL Database

You can create a free PostgreSQL database on **Render**, **Neon.tech**, or **Supabase**.

### Option A: PostgreSQL on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **PostgreSQL**.
2. **Name**: `dash-1-db`
3. **Database**: `database_db`
4. **User**: `database_user`
5. **Region**: Oregon (or closest to you)
6. Select **Free** plan.
7. Click **Create Database**.
8. Save the connection credentials:
   - **External Database URL**: `postgresql://database_user:PASSWORD@dpg-xxxxxx-a.oregon-postgres.render.com/database_db`
   - **Hostname**: `dpg-xxxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `database_db`
   - **Username**: `database_user`
   - **Password**: *(your generated password)*

---

## 🛠️ Step 1.5: Connect Local pgAdmin to Cloud Database

To manage your live cloud database from your PC using pgAdmin:

1. Open **pgAdmin** on your local computer.
2. In the left panel, right-click on **Servers** ➔ **Register** ➔ **Server...**
3. In the **General** tab:
   - **Name**: `Render Cloud DB` (or any friendly name)
4. In the **Connection** tab:
   - **Host name/address**: *(Your Hostname from Step 1, e.g., `dpg-xxxxxx-a.oregon-postgres.render.com`)*
   - **Port**: `5432`
   - **Maintenance database**: `database_db`
   - **Username**: `database_user`
   - **Password**: *(Your Password from Step 1)*
   - Check **Save Password?**
5. In the **Parameters** tab:
   - Set **SSL mode** to `Require`.
6. Click **Save**.

🎉 **Done!** You can now expand the server in pgAdmin to inspect tables (`Schemas -> public -> Tables`), run SQL queries, and manage data live on cloud!

---


## ⚡ Step 2: Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Connect your GitHub repository (`Dashboard-2` / `Dash-1`).
3. Fill in the deployment details:
   - **Name**: `dash-1-backend`
   - **Region**: Same as database (e.g., Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

4. Add **Environment Variables** under the *Environment* tab:
   | Key | Value / Example |
   | :--- | :--- |
   | `DATABASE_URL` | *Your PostgreSQL URL from Step 1* (e.g., `postgresql://...`) |
   | `SECRET_KEY` | *Any random string* (e.g., `supersecretkey12345`) |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
   | `FRONTEND_URL` | *Your Vercel URL (add after Step 3)* |

5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g. `https://dash-1-backend.onrender.com`).
   - Test it by opening `https://dash-1-backend.onrender.com/health` in your browser. It should show `{"status":"healthy","database":"connected"}`.

---

## 💻 Step 3: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import your GitHub repository (`Dashboard-2` / `Dash-1`).
3. Configure the Project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend`.
4. Open **Environment Variables** section and add:
   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://dash-1-backend.onrender.com` *(Your Render Backend URL)* |
   | `BACKEND_URL` | `https://dash-1-backend.onrender.com` *(Your Render Backend URL)* |
   | `NEXTAUTH_SECRET` | *Any random secret string* (e.g., `my_nextauth_secret_key_123`) |
   | `NEXTAUTH_URL` | *Your Vercel deployment URL (optional)* |

5. Click **Deploy**.
6. Once deployed, copy your live Vercel URL (e.g. `https://dashboard-2.vercel.app`).

---

## 🔄 Step 4: Add Vercel URL to Render CORS (Final Step)

1. Go back to your **Render Backend Web Service** (`dash-1-backend`).
2. Go to **Environment** tab.
3. Update or add `FRONTEND_URL` = `https://your-app.vercel.app`.
4. Save changes (Render will restart the backend).

---

## 🔑 Pre-seeded Logins

Upon first deployment, the backend automatically initializes database tables and seeds demo accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@sage.com` | `password` |
| **Teacher** | `teacher@sage.com` | `password` |
| **Student** | `vaibhav@sage.com` | `password` |

---

## ❓ Troubleshooting & FAQs

- **Backend Wake-up Delay**: Render free tier puts backend to sleep after 15 mins of inactivity. The first request takes ~20–30s to wake up. The frontend automatically retries when waking up.
- **Database Connection Failure**: Ensure `DATABASE_URL` starts with `postgresql://` (if it has `postgres://`, our backend code automatically fixes it to `postgresql://`).
- **CORS Error**: Ensure `FRONTEND_URL` on Render matches your exact Vercel domain.

