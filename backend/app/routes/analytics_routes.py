import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..auth import require_admin
from ..database import get_db
from ..models import ActivityLog, Lead, Report, User, Visit
from ..schemas import LeadCreate, VisitCreate
from ..utils.analytics import log_activity
from ..utils.email_service import send_owner_lead_alert, send_owner_visitor_alert
from ..utils.serializers import activity_to_dict, lead_to_dict, visit_to_dict

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.post("/visit")
def track_visit(payload: VisitCreate, request: Request, db: Session = Depends(get_db)):
    session_id = (
        payload.anonymous_session_id
        or request.headers.get("x-session-id")
        or uuid.uuid4().hex
    )
    user_agent = payload.user_agent or request.headers.get("user-agent") or "Unknown"
    page = payload.page or "Landing Page"
    first_visit = (
        db.query(Visit).filter(Visit.anonymous_session_id == session_id).first() is None
    )
    alert_sent = (
        bool(send_owner_visitor_alert(page, user_agent).get("sent"))
        if first_visit
        else False
    )
    visit = Visit(
        page=page,
        user_agent=user_agent,
        anonymous_session_id=session_id,
        alert_sent=alert_sent,
    )
    db.add(visit)
    db.commit()
    return {"message": "Visit tracked", "anonymous_session_id": session_id}


@router.post("/lead")
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    result = send_owner_lead_alert(
        payload.name, payload.email, payload.company_role, payload.message
    )
    lead = Lead(
        name=payload.name.strip(),
        email=payload.email.lower(),
        company_role=(payload.company_role or "").strip() or None,
        message=payload.message.strip(),
        alert_sent=bool(result.get("sent")),
    )
    db.add(lead)
    db.commit()
    log_activity(db, "lead_created", f"New lead from {lead.email}", lead.email)
    return {
        "message": "Thanks! Your message has been received.",
        "alert_sent": lead.alert_sent,
    }


@router.get("/summary")
def analytics_summary(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    total_visitors = db.query(func.count(Visit.id)).scalar() or 0
    total_sessions = (
        db.query(func.count(func.distinct(Visit.anonymous_session_id))).scalar() or 0
    )
    total_leads = db.query(func.count(Lead.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_reports = db.query(func.count(Report.id)).scalar() or 0
    report_emails_sent = (
        db.query(func.count(Report.id)).filter(Report.email_sent.is_(True)).scalar()
        or 0
    )
    visitor_alerts_sent = (
        db.query(func.count(Visit.id)).filter(Visit.alert_sent.is_(True)).scalar() or 0
    )
    lead_alerts_sent = (
        db.query(func.count(Lead.id)).filter(Lead.alert_sent.is_(True)).scalar() or 0
    )
    visit_count = func.count(Visit.id).label("visits")
    most_visited = (
        db.query(Visit.page, visit_count)
        .group_by(Visit.page)
        .order_by(visit_count.desc())
        .limit(8)
        .all()
    )
    recent_activity = (
        db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(8).all()
    )
    return {
        "total_visitors": total_visitors,
        "total_sessions": total_sessions,
        "total_leads": total_leads,
        "total_users": total_users,
        "total_reports": total_reports,
        "emails_sent": report_emails_sent + visitor_alerts_sent + lead_alerts_sent,
        "most_visited_pages": [{"page": p, "visits": v} for p, v in most_visited],
        "recent_activity": [activity_to_dict(a) for a in recent_activity],
    }


@router.get("/leads")
def analytics_leads(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    return [
        lead_to_dict(l)
        for l in db.query(Lead).order_by(Lead.created_at.desc()).limit(100).all()
    ]


@router.get("/visits")
def analytics_visits(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    return [
        visit_to_dict(v)
        for v in db.query(Visit).order_by(Visit.visited_at.desc()).limit(100).all()
    ]


@router.get("/admin-activity")
def analytics_activity(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    return [
        activity_to_dict(a)
        for a in db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(100)
        .all()
    ]
