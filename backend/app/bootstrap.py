import os
from sqlalchemy.orm import Session
from .auth import get_password_hash
from .models import User
from .utils.analytics import log_activity

DEFAULT_ADMIN_EMAIL = "admin@noctragriddemo.com"
DEFAULT_ADMIN_PASSWORD = "NoctraGridAdmin@123"
DEFAULT_ADMIN_NAME = "NoctraGrid Owner"


def admin_email() -> str:
    return os.getenv("ADMIN_EMAIL", DEFAULT_ADMIN_EMAIL).strip().lower()


def admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD).strip()


def admin_name() -> str:
    return os.getenv("ADMIN_NAME", DEFAULT_ADMIN_NAME).strip() or DEFAULT_ADMIN_NAME


def ensure_admin_user(db: Session) -> User | None:
    """Create or sync the single owner/admin account from environment variables.

    ADMIN_EMAIL and ADMIN_PASSWORD are the source of truth. Keeping this in code
    means the owner can change the admin login from Railway/local env without
    manually editing the database.
    """
    email = admin_email()
    password = admin_password()
    name = admin_name()
    if not email or not password:
        return None

    admin = db.query(User).filter(User.email == email).first()
    created = False
    if admin is None:
        admin = User(
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            is_admin=True,
        )
        db.add(admin)
        created = True
    else:
        admin.name = name
        admin.is_admin = True
        # Sync password by default so changing ADMIN_PASSWORD immediately works.
        if os.getenv("ADMIN_SYNC_PASSWORD", "true").lower() != "false":
            admin.hashed_password = get_password_hash(password)

    # Keep only this configured account as admin unless explicitly allowed.
    if os.getenv("ALLOW_MULTIPLE_ADMINS", "false").lower() != "true":
        other_admins = (
            db.query(User).filter(User.email != email, User.is_admin.is_(True)).all()
        )
        for user in other_admins:
            user.is_admin = False

    db.commit()
    db.refresh(admin)
    if created:
        log_activity(db, "admin_bootstrap", f"Default admin account created: {email}", email)
    return admin
