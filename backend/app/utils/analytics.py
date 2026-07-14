from sqlalchemy.orm import Session
from ..models import ActivityLog


def log_activity(
    db: Session, event_type: str, description: str, actor_email: str | None = None
) -> None:
    activity = ActivityLog(
        event_type=event_type, description=description, actor_email=actor_email
    )
    db.add(activity)
    db.commit()


def browser_label(user_agent: str | None) -> str:
    if not user_agent:
        return "Unknown browser"
    agent = user_agent.lower()
    if "edg/" in agent:
        return "Microsoft Edge"
    if "chrome" in agent and "safari" in agent:
        return "Chrome"
    if "firefox" in agent:
        return "Firefox"
    if "safari" in agent and "chrome" not in agent:
        return "Safari"
    return "Browser"
