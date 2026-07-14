# Backend README — NoctraGrid Relay

FastAPI backend for spreadsheet upload, cleaning, PDF generation, JWT auth, admin analytics, and Gmail SMTP email automation.

## Run locally

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Main email flow

`POST /api/files/{file_id}/generate-and-email` cleans the file if needed, generates the PDF, stores the report, and sends the generated PDF to the recipient using `SMTP_USERNAME` + `SMTP_APP_PASSWORD`.

## Required SMTP variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=your-gmail-address@gmail.com
SMTP_APP_PASSWORD=your_google_app_password
SMTP_FROM_EMAIL=your-gmail-address@gmail.com
```

Full documentation: `../docs/NOCTRAGRID_RELAY_COMPLETE_DOCUMENTATION_HINGLISH.md`.
