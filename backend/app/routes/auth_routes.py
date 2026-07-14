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
from ..models import User
from ..schemas import AuthResponse, UserCreate, UserLogin, UserOut
from ..utils.analytics import log_activity

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
