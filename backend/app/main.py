import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, SessionLocal
from .routes import (
    admin_routes,
    analytics_routes,
    auth_routes,
    history_routes,
    report_routes,
    upload_routes,
)
from .bootstrap import ensure_admin_user
from .utils.excel_processor import CLEANED_DIR, REPORTS_DIR, UPLOAD_DIR

Base.metadata.create_all(bind=engine)
for directory in [UPLOAD_DIR, CLEANED_DIR, REPORTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
app = FastAPI(
    title="NoctraGrid Relay API",
    description="Mini Zapier for Excel: upload, clean, report, email, and history.",
    version="1.0.0",
)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [o.strip() for o in frontend_url.split(",") if o.strip()] + [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(allowed_origins)),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(upload_routes.router)
app.include_router(report_routes.router)
app.include_router(history_routes.router)
app.include_router(analytics_routes.router)


@app.on_event("startup")
def bootstrap_owner_account():
    with SessionLocal() as db:
        ensure_admin_user(db)


@app.get("/")
def root():
    return {"message": "NoctraGrid Relay API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
