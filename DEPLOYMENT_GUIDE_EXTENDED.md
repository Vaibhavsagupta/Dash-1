# 📘 The Ultimate Deployment Troubleshooting Guide

If you are seeing "Failed to fetch", "Build Failed", or "Application Error", follow this guide strictly.

---

## 🛑 PART 1: Backend Deployment (Render.com)

**Most Common Errors:**
*   **"Build Failed"**: Wrong Root Directory.
*   **"Application Error" / "Internal Server Error"**: Database URL is missing or wrong.
*   **"Deploy Failed"**: Python version mismatch.

### 📝 Step-by-Step Fixes

1.  **Delete & Restart Web Service** (If current one is messy):
    *   It's often cleaner to delete the broken service and start fresh.

2.  **Create New Web Service**:
    *   **Repo**: Connect `Vaibhavsagupta/Dash-1`.
    *   **⚠️ CRITICAL SETTING 1**: `Root Directory`
        *   You **MUST** type: `backend`
        *   *Why?* Your code is inside a subfolder. If you leave this blank, Render looks for `requirements.txt` in the main folder, doesn't find it, and fails.
    *   **Environment**: `Python 3`

3.  **Build & Start Commands**:
    *   **Build Command**: `pip install -r requirements.txt`
        *   *Check:* Does your `requirements.txt` exist in `backend/`? Yes, we verified it.
    *   **Start Command**: `gunicorn -k uvicorn.workers.UvicornWorker app.main:app`
        *   *Note:* Ensure there are no typos. `app.main:app` refers to `app/main.py`.

4.  **Environment Variables (The Secret Sauce)**:
    *   If these are missing, the app **WILL CRASH** immediately upon starting.
    *   `DATABASE_URL`: `postgresql://postgres:Vaibhav4537@db.jagktlidgzbwinyyuqto.supabase.co:5432/postgres`
    *   `PYTHON_VERSION`: `3.9.0` (or `3.10.0`)

5.  **Hit Deploy & Watch Logs**:
    *   Click "Logs".
    *   Wait for `Application startup complete`.
    *   **Copy the URL** (e.g., `https://dashboard-backend.onrender.com`).
    *   *Test it:* Open that URL + `/health` in your browser (e.g., `https://...onrender.com/health`).
    *   *Success:* It says `{"status":"healthy"}`.
    *   *Failure:* If it spins or errors, check the Logs tab for the specific python error.

---

## 🛑 PART 2: Frontend Deployment (Vercel)

**Most Common Errors:**
*   **"Failed to fetch" on Login**: The `NEXT_PUBLIC_API_URL` variable is missing or points to localhost.
*   **404 Not Found**: Wrong Root Directory.

### 📝 Step-by-Step Fixes

1.  **Create New Project**:
    *   Import `Vaibhavsagupta/Dash-1`.

2.  **⚠️ CRITICAL SETTING 2**: `Root Directory`
    *   Click **Edit** next to "Root Directory".
    *   Select `frontend`.
    *   *Why?* Your Next.js app is in the `frontend` folder.

3.  **Environment Variables**:
    *   Exapand "Environment Variables".
    *   **Key**: `NEXT_PUBLIC_API_URL`
    *   **Value**: Paste your **Render Backend URL** from Part 1.
        *   ❌ WRONG: `http://localhost:7000` (This only works on YOUR computer)
        *   ✅ CORRECT: `https://dashboard-backend-xyz.onrender.com` (No trailing slash `/` at the end)

4.  **Deploy**:
    *   Click Deploy.
    *   Wait for the confetti.

---

## 🛑 PART 3: Post-Deployment "Failed to Fetch" Troubleshooting

If you login and see **"Failed to fetch"**:

1.  **Check Vercel Env Var**:
    *   Go to Vercel Project -> Settings -> Environment Variables.
    *   Did you verify `NEXT_PUBLIC_API_URL` is set?
    *   Did you **Redeploy** after setting it? (Changing vars DOES NOT auto-update the running site. You MUST go to Deployments -> ... -> Redeploy).

2.  **Check Browser Console**:
    *   Right-click the page -> Inspect -> Console.
    *   Look for red errors.
    *   *Error: Mixed Content*: You are on `https://` (Vercel) trying to hit `http://` (Render). Make sure your Render URL is `https://`.
    *   *Error: Connection Refused*: You are trying to hit `127.0.0.1`. This means the Env Var fallback triggered. Go back to step 1.

3.  **Check Backend**:
    *   Is your Render service "Suspended" (free tier)? It might take 50 seconds to wake up.
    *   Wait a minute and try again.
