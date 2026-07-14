from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..auth import require_admin
from ..database import get_db
from ..models import ActivityLog, Report, UploadedFile, User
from ..utils.analytics import log_activity
from ..utils.serializers import activity_to_dict, admin_report_to_dict, admin_user_to_dict

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _delete_file(path_value: str | None) -> None:
    if not path_value:
        return
    path = Path(path_value)
    if path.exists() and path.is_file():
        path.unlink(missing_ok=True)


@router.get("/users")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    upload_counts = dict(
        db.query(UploadedFile.user_id, func.count(UploadedFile.id))
        .group_by(UploadedFile.user_id)
        .all()
    )
    report_counts = dict(
        db.query(Report.user_id, func.count(Report.id)).group_by(Report.user_id).all()
    )
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [admin_user_to_dict(user, upload_counts, report_counts) for user in users]


@router.get("/reports")
def list_all_reports(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    reports = db.query(Report).order_by(Report.created_at.desc()).limit(250).all()
    return [admin_report_to_dict(report) for report in reports]


@router.get("/activity")
def list_activity(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [
        activity_to_dict(item)
        for item in db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(250)
        .all()
    ]


@router.delete("/reports/{report_id}")
def delete_any_report(
    report_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    for path_value in [
        report.pdf_file_path,
        report.cleaned_file_path,
        report.cleaned_csv_path,
    ]:
        _delete_file(path_value)
    owner_email = report.user.email if report.user else "unknown"
    db.delete(report)
    db.commit()
    log_activity(db, "admin_report_deleted", f"Admin deleted report {report_id} owned by {owner_email}", admin.email)
    return {"message": "Report deleted by admin."}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id or user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin owner account cannot be deleted from the dashboard.",
        )
    email = user.email
    for report in list(user.reports):
        for path_value in [
            report.pdf_file_path,
            report.cleaned_file_path,
            report.cleaned_csv_path,
        ]:
            _delete_file(path_value)
    for upload in list(user.uploads):
        for path_value in [
            upload.file_path,
            upload.cleaned_file_path,
            upload.cleaned_csv_path,
        ]:
            _delete_file(path_value)
    db.delete(user)
    db.commit()
    log_activity(db, "admin_user_deleted", f"Admin deleted user {email}", admin.email)
    return {"message": "User and related records deleted by admin."}
