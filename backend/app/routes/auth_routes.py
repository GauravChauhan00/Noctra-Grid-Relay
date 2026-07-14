import random
import string
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from ..bootstrap import admin_email, ensure_admin_user
from ..database import get_db
from ..models import PasswordResetOTP, User
from ..models import utc_now
from ..schemas import (
    AuthResponse, ForgotPasswordRequest, MessageResponse,
    ResetPasswordRequest, UserCreate, UserLogin, UserOut, VerifyOTPRequest,
)
from ..utils.analytics import log_activity
from ..utils.email_service import send_smtp_email

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def auth_payload(user: User) -> dict:
    return {
        "access_token": create_access_token({"sub": user.email}),
        "token_type": "bearer",
        "user": user,
    }


@router.post("/signup", response_model=AuthResponse)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if email == admin_email():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is reserved for Admin Login. Use the Admin Login tab.",
        )
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    user = User(
        name=payload.name.strip(),
        email=email,
        hashed_password=get_password_hash(payload.password),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_activity(db, "signup", f"{user.name} created a user account", user.email)
    return auth_payload(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts must use the Admin Login portal.",
        )
    log_activity(db, "login", f"{user.name} logged in", user.email)
    return auth_payload(user)


@router.post("/admin/login", response_model=AuthResponse)
def admin_login(payload: UserLogin, db: Session = Depends(get_db)):
    ensure_admin_user(db)
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if email != admin_email() or not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin ID or password",
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin ID or password",
        )
    log_activity(db, "admin_login", f"Admin owner logged in", user.email)
    return auth_payload(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    # Always return success to prevent email enumeration
    if not user or user.is_admin:
        return {"message": "If that email is registered, an OTP has been sent."}

    # Invalidate any existing OTPs for this email
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email,
        PasswordResetOTP.is_used == False,  # noqa: E712
    ).update({"is_used": True})
    db.flush()

    otp_code = _generate_otp()
    expires = utc_now() + timedelta(minutes=15)
    otp_record = PasswordResetOTP(
        email=email,
        otp_code=otp_code,
        expires_at=expires,
    )
    db.add(otp_record)
    db.commit()

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
      <h2 style="color:#2d7a4f;margin-bottom:8px;">Password Reset</h2>
      <p style="color:#3a4240;">Hello {user.name},</p>
      <p style="color:#3a4240;">Use the verification code below to reset your NoctraGrid Relay password.
         This code expires in <strong>15 minutes</strong>.</p>
      <div style="background:#f0f7f3;border:1px solid #c3dece;border-radius:12px;
                  padding:24px;text-align:center;margin:24px 0;">
        <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#2d7a4f;">{otp_code}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;">If you did not request a password reset, please ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;">NoctraGrid Relay &mdash; Automated Data Processing Platform</p>
    </div>
    """
    res = send_smtp_email(to_email=email, subject="Your NoctraGrid Relay password reset code", html=html)
    if not res.get("sent"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email failed to send. Please check admin SMTP settings. Details: {res.get('message')}"
        )
    log_activity(db, "forgot_password", f"Password reset OTP sent to {email}")
    return {"message": "Verification code sent to your email address."}


@router.post("/verify-otp", response_model=MessageResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    record = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.email == email,
            PasswordResetOTP.otp_code == payload.otp_code,
            PasswordResetOTP.is_used == False,  # noqa: E712
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP.")
    if utc_now() > record.expires_at.replace(tzinfo=record.expires_at.tzinfo or __import__('datetime').timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")
    return {"message": "OTP verified."}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    record = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.email == email,
            PasswordResetOTP.otp_code == payload.otp_code,
            PasswordResetOTP.is_used == False,  # noqa: E712
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    from datetime import timezone
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP.")
    if utc_now() > record.expires_at.replace(tzinfo=record.expires_at.tzinfo or timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    record.is_used = True
    db.commit()
    log_activity(db, "password_reset", f"Password successfully reset for {email}")
    return {"message": "Password has been reset successfully. You can now log in."}
