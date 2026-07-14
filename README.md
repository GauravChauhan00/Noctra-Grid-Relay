# NoctraGrid Relay

**Automated Data Processing & Report Delivery Platform**

NoctraGrid Relay is a professional, full-stack application designed to streamline data processing workflows. Users can upload raw datasets (Excel/CSV), automatically clean and standardize records, generate visual PDF reports, and deliver findings directly to target inboxes in a single automated step.

---

## Key Features

- **Personal Workspace:** Individual dashboard for members to upload files, process reports, and view historical runs.
- **Data Hygiene Engine:** Automated duplicate detection, gap correction, and data formatting powered by Python Pandas.
- **Custom Visual Reporting:** Automated generation of professional PDF reports featuring charts, category shares, and date trends.
- **Automated Dispatch:** Secure email delivery of compiled PDF reports directly to destination inboxes.
- **Administrative Dashboard:** Platform-wide oversight to monitor system metrics, user access, logs, and overall system activity.
- **Access Control:** Secure authentication and role-based path protection separating administrative portals from standard members.

---

## Tech Stack

- **Frontend:** React, React Router, Vite, Recharts, Lucide Icons, CSS
- **Backend:** FastAPI, Python, SQLAlchemy (SQLite/PostgreSQL), Pandas, ReportLab

---

## Local Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env` (refer to `.env.example`).
5. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
