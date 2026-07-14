# 🚀 Render Deployment Guide — NoctraGrid Relay

Follow these exact steps to deploy the Backend and Frontend of NoctraGrid Relay on Render.

---

## 🛠️ STEP 1 — Deploy the BACKEND (Python Web Service)

1. Go to your **[Render Dashboard](https://dashboard.render.com)** and log in with your GitHub account.
2. Click **"New +"** (top-right) and select **"Web Service"**.
3. Select your repository: **`Noctra-Grid-Relay`** and click **Connect**.
4. Configure the Web Service settings as follows:

| Setting | Value |
| :--- | :--- |
| **Name** | `noctra-grid-relay-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Python` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --loop asyncio` |
| **Instance Type** | `Free` |

5. Scroll down and click **"Advanced"**. Under **"Environment Variables"**, add the following keys:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./noctragrid.db` | Or a PostgreSQL URL if using a database service |
| `SECRET_KEY` | `generate-a-long-random-string` | Used to sign auth tokens |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` | *Add this after you deploy the frontend* |
| `SMTP_USERNAME` | `gaurav949855@gmail.com` | Your Gmail address |
| `SMTP_APP_PASSWORD` | `avqqmxqdxpyftqxp` | Your 16-character Google App Password |
| `SMTP_FROM_NAME` | `NoctraGrid Relay` | Email sender name |
| `SMTP_FROM_EMAIL` | `gaurav949855@gmail.com` | Gmail address |
| `OWNER_ALERT_EMAIL` | `gaurav949855@gmail.com` | Alerts receiver |

6. Click **"Create Web Service"**.
7. Once successfully deployed, copy your backend URL from the top-left of the service page (e.g., `https://noctra-grid-relay-backend.onrender.com`).

---

## 💻 STEP 2 — Deploy the FRONTEND (Static Site)

1. Return to the **Render Dashboard**, click **"New +"** and select **"Static Site"**.
2. Connect the same repository: **`Noctra-Grid-Relay`**.
3. Configure the Static Site settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `noctra-grid-relay-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |

4. Scroll down, click **"Advanced"** and add this under **"Environment Variables"**:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://noctra-grid-relay-backend.onrender.com` | *Use your actual Backend URL from Step 1* |

5. Click **"Create Static Site"**.
6. Once deployed, copy your frontend URL (e.g., `https://noctra-grid-relay-frontend.onrender.com`).

---

## 🔗 STEP 3 — Update Backend CORS

1. Go back to your **Backend Web Service** settings in the Render Dashboard.
2. Under **"Environment Variables"**, edit `FRONTEND_URL` and set its value to your actual **Frontend URL** (e.g., `https://noctra-grid-relay-frontend.onrender.com`).
3. Save the changes. Render will automatically redeploy the backend with the correct CORS origins.
