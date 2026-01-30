# Frontend Deployment Guide (Vercel)

Since your project is a Next.js application located in the `frontend` subfolder, the best way to deploy it is via **Vercel**.

---

## 1. Create a New Project on Vercel
1. Go to [Vercel.com](https://vercel.com/) and log in with your GitHub account.
2. Click **Add New** > **Project**.
3. Import your repository: `gitvai/dash`.

## 2. Configure Project Settings
Vercel will detect the repository. You must configure the following:

*   **Framework Preset**: `Next.js`
*   **Root Directory**: `frontend` (CRITICAL: Click **Edit** and select the `frontend` folder)
*   **Build Command**: `npm run build`
*   **Install Command**: `npm install`
*   **Output Directory**: `.next` (default)

## 3. Environment Variables
Before clicking deploy, open the **Environment Variables** section and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend-api.onrender.com` | **The URL of your deployed Render backend** |

*Important: Make sure the backend URL does NOT have a trailing slash (e.g., use `...onrender.com` NOT `...onrender.com/`).*

## 4. Finalizing Deployment
1. Click **Deploy**.
2. Vercel will build your application and provide a production URL (e.g., `https://dash-frontend.vercel.app`).

---

## 5. Connect Frontend and Backend
Once your frontend is deployed, you must "whitelist" it in your backend settings to avoid CORS errors.

1. Go back to your **Render.com** dashboard for the backend service.
2. Go to **Environment**.
3. Update the `FRONTEND_URL` variable with your new Vercel URL:
   `FRONTEND_URL = https://dash-frontend.vercel.app`
4. Render will automatically redeploy with the new settings.

---

### Verification
Visit your Vercel URL. You should now be able to log in and see the analytics dashboard fetching live data from your Render backend.
