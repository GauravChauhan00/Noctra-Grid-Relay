import json
from typing import Any
from ..models import ActivityLog, Lead, Report, User, Visit


def safe_json_loads(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def report_to_dict(report: Report) -> dict[str, Any]:
    return {
        "id": report.id,
        "original_filename": report.original_filename,
        "created_at": report.created_at,
        "status": report.status,
        "rows_processed": report.rows_processed,
        "duplicates_removed": report.duplicates_removed,
        "missing_values_fixed": report.missing_values_fixed,
        "email_sent": report.email_sent,
        "summary": safe_json_loads(report.summary_json),
    }


def admin_report_to_dict(report: Report) -> dict[str, Any]:
    data = report_to_dict(report)
    data.update(
        {
            "user_id": report.user_id,
            "user_name": report.user.name if report.user else "Deleted user",
            "user_email": report.user.email if report.user else "unknown",
            "uploaded_file_id": report.uploaded_file_id,
        }
    )
    return data


def admin_user_to_dict(
    user: User, upload_counts: dict[int, int], report_counts: dict[int, int]
) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
        "uploads_count": int(upload_counts.get(user.id, 0)),
        "reports_count": int(report_counts.get(user.id, 0)),
    }


def lead_to_dict(lead: Lead) -> dict[str, Any]:
    return {
        "id": lead.id,
        "name": lead.name,
        "email": lead.email,
        "company_role": lead.company_role,
        "message": lead.message,
        "created_at": lead.created_at,
        "alert_sent": lead.alert_sent,
    }


def visit_to_dict(visit: Visit) -> dict[str, Any]:
    return {
        "id": visit.id,
        "page": visit.page,
        "visited_at": visit.visited_at,
        "user_agent": visit.user_agent,
        "anonymous_session_id": visit.anonymous_session_id,
        "alert_sent": visit.alert_sent,
    }


def activity_to_dict(activity: ActivityLog) -> dict[str, Any]:
    return {
        "id": activity.id,
        "event_type": activity.event_type,
        "description": activity.description,
        "actor_email": activity.actor_email,
        "created_at": activity.created_at,
    }
