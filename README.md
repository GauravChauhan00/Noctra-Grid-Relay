# NoctraGrid Relay

**Obsidian-grade spreadsheet intelligence that cleans, reports, and delivers itself.**

NoctraGrid Relay is a full-stack React + FastAPI spreadsheet automation project. A user uploads Excel/CSV, enters an email address, and the backend automatically cleans the data, generates a professional PDF report, saves report history, and sends the generated PDF using **Google App Password SMTP**.

## Main features

- Premium dark hacker-style React UI.
- User signup/login and admin-only analytics.
- Excel/CSV upload with preview.
- Pandas data cleaning.
- Cleaned Excel/CSV export.
- ReportLab PDF generation.
- One-click **Generate PDF + Auto Email** workflow.
- Gmail SMTP App Password email delivery. No Render mail system and no third-party email API required.
- Report history and report detail pages.
- Admin user/report/lead/visit/activity management.
- Vercel frontend + Railway backend ready.

## Important documentation

Read the complete architecture, workflow, API, deployment, SMTP, React, backend, file-by-file explanation here:

[`docs/NOCTRAGRID_RELAY_COMPLETE_DOCUMENTATION_HINGLISH.md`](docs/NOCTRAGRID_RELAY_COMPLETE_DOCUMENTATION_HINGLISH.md)

## Local backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Local frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Gmail SMTP variables

Add these in `backend/.env` locally or Railway variables in production:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USE_SSL=false
SMTP_USERNAME=your-gmail-address@gmail.com
SMTP_APP_PASSWORD=your_16_character_google_app_password
SMTP_FROM_NAME=NoctraGrid Relay
SMTP_FROM_EMAIL=your-gmail-address@gmail.com
SMTP_REPLY_TO_EMAIL=your-gmail-address@gmail.com
OWNER_ALERT_EMAIL=your-gmail-address@gmail.com
```

Never commit your real Google App Password.
