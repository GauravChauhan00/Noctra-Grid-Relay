from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from ..models import Report, User
from ..schemas import EmailReportRequest, EmailResponse, GenerateReportResponse
from ..utils.analytics import log_activity
from ..utils.email_service import send_report_email
from ..utils.serializers import report_to_dict, safe_json_loads

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def get_owned_report(report_id: int, current_user: User, db: Session) -> Report:
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    return report


@router.get("", response_model=list[GenerateReportResponse])
def list_reports(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return [
        report_to_dict(r)
        for r in db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    ]


@router.get("/{report_id}", response_model=GenerateReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return report_to_dict(get_owned_report(report_id, current_user, db))


def send_file(path_value: str | None, filename: str, media_type: str):
    if not path_value:
        raise HTTPException(status_code=404, detail="File not available")
    path = Path(path_value)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(path=str(path), filename=filename, media_type=media_type)


@router.get("/{report_id}/download/pdf")
def download_pdf(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_owned_report(report_id, current_user, db)
    return send_file(
        report.pdf_file_path, f"noctragrid-report-{report.id}.pdf", "application/pdf"
    )


@router.get("/{report_id}/download/excel")
def download_excel(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_owned_report(report_id, current_user, db)
    return send_file(
        report.cleaned_file_path,
        f"noctragrid-cleaned-{report.id}.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/{report_id}/download/csv")
def download_csv(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_owned_report(report_id, current_user, db)
    return send_file(
        report.cleaned_csv_path, f"noctragrid-cleaned-{report.id}.csv", "text/csv"
    )


@router.post("/{report_id}/email", response_model=EmailResponse)
def email_report(
    report_id: int,
    payload: EmailReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = get_owned_report(report_id, current_user, db)
    summary = safe_json_loads(report.summary_json)
    result = send_report_email(
        payload.recipient_email, report, summary, report.pdf_file_path
    )
    if result.get("sent"):
        report.email_sent = True
        db.commit()
        log_activity(
            db,
            "report_emailed",
            f"Report {report.id} emailed to {payload.recipient_email}",
            current_user.email,
        )
    return result
