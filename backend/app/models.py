from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    uploads = relationship(
        "UploadedFile", back_populates="user", cascade="all, delete-orphan"
    )
    reports = relationship(
        "Report", back_populates="user", cascade="all, delete-orphan"
    )


class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    cleaned_file_path = Column(String(500), nullable=True)
    cleaned_csv_path = Column(String(500), nullable=True)
    cleaning_summary_json = Column(Text, nullable=True)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    status = Column(String(50), default="uploaded")
    uploaded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    user = relationship("User", back_populates="uploads")
    reports = relationship(
        "Report", back_populates="uploaded_file", cascade="all, delete-orphan"
    )


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    uploaded_file_id = Column(
        Integer, ForeignKey("uploaded_files.id"), nullable=True, index=True
    )
    original_filename = Column(String(255), nullable=False)
    cleaned_file_path = Column(String(500), nullable=True)
    cleaned_csv_path = Column(String(500), nullable=True)
    pdf_file_path = Column(String(500), nullable=True)
    summary_json = Column(Text, nullable=True)
    status = Column(String(50), default="completed")
    rows_processed = Column(Integer, default=0)
    duplicates_removed = Column(Integer, default=0)
    missing_values_fixed = Column(Integer, default=0)
    email_sent = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    user = relationship("User", back_populates="reports")
    uploaded_file = relationship("UploadedFile", back_populates="reports")


class Visit(Base):
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True, index=True)
    page = Column(String(120), nullable=False, default="Landing Page")
    visited_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    user_agent = Column(Text, nullable=True)
    anonymous_session_id = Column(String(160), nullable=False, index=True)
    alert_sent = Column(Boolean, default=False, nullable=False)


class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    company_role = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    alert_sent = Column(Boolean, default=False, nullable=False)


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    actor_email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
