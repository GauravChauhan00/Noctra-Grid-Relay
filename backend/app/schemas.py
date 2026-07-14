from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UploadResponse(BaseModel):
    file_id: int
    original_filename: str
    row_count: int
    column_count: int
    columns: list[str]
    preview: list[dict[str, Any]]
    status: str


class CleanResponse(BaseModel):
    file_id: int
    summary: dict[str, Any] = Field(default_factory=dict)
    preview: list[dict[str, Any]] = Field(default_factory=list)
    status: str


class GenerateReportResponse(BaseModel):
    id: int
    original_filename: str
    created_at: datetime
    status: str
    rows_processed: int
    duplicates_removed: int
    missing_values_fixed: int
    email_sent: bool
    summary: dict[str, Any] = Field(default_factory=dict)


class EmailReportRequest(BaseModel):
    recipient_email: EmailStr


class EmailResponse(BaseModel):
    sent: bool
    message: str


class GenerateAndEmailResponse(BaseModel):
    report: GenerateReportResponse
    email: EmailResponse


class VisitCreate(BaseModel):
    page: str = "Landing Page"
    user_agent: Optional[str] = None
    anonymous_session_id: Optional[str] = None


class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    company_role: Optional[str] = None
    message: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str = Field(min_length=6)


class MessageResponse(BaseModel):
    message: str

