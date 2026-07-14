import json
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from ..models import Report, UploadedFile, User
from ..schemas import (
    CleanResponse,
    EmailReportRequest,
    GenerateAndEmailResponse,
    GenerateReportResponse,
    UploadResponse,
)
from ..utils.analytics import log_activity
from ..utils.email_service import send_report_email
from ..utils.excel_processor import (
    clean_dataframe,
    dataframe_preview,
    read_dataframe,
    save_cleaned_files,
    save_upload_file,
)
from ..utils.report_generator import (
    create_report_payload,
    generate_pdf_report,
    new_pdf_path,
)
from ..utils.serializers import report_to_dict, safe_json_loads

router = APIRouter(prefix="/api/files", tags=["Files"])


def get_owned_file(file_id: int, current_user: User, db: Session) -> UploadedFile:
    uploaded = (
        db.query(UploadedFile)
        .filter(UploadedFile.id == file_id, UploadedFile.user_id == current_user.id)
        .first()
    )
    if not uploaded:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )
    return uploaded


def create_report_for_uploaded_file(
    uploaded: UploadedFile, current_user: User, db: Session
) -> Report:
    """Clean when needed, generate a PDF report, save report history, and return it."""
    if not uploaded.cleaned_file_path or not uploaded.cleaning_summary_json:
        df = read_dataframe(uploaded.file_path)
        cleaned_df, cleaning_summary = clean_dataframe(df)
        excel_path, csv_path = save_cleaned_files(
            cleaned_df, uploaded.original_filename
        )
        uploaded.cleaned_file_path = str(excel_path)
        uploaded.cleaned_csv_path = str(csv_path)
        uploaded.cleaning_summary_json = json.dumps(cleaning_summary)
        uploaded.status = "cleaned"
        db.commit()
    else:
        cleaned_df = read_dataframe(uploaded.cleaned_file_path)
        cleaning_summary = safe_json_loads(uploaded.cleaning_summary_json)

    payload = create_report_payload(
        cleaned_df, cleaning_summary, uploaded.original_filename
    )
    pdf_path = new_pdf_path(uploaded.original_filename)
    generate_pdf_report(payload, pdf_path)
    report = Report(
        user_id=current_user.id,
        uploaded_file_id=uploaded.id,
        original_filename=uploaded.original_filename,
        cleaned_file_path=uploaded.cleaned_file_path,
        cleaned_csv_path=uploaded.cleaned_csv_path,
        pdf_file_path=str(pdf_path),
        summary_json=json.dumps(payload),
        rows_processed=int(payload.get("summary_cards", {}).get("total_rows", 0)),
        duplicates_removed=int(cleaning_summary.get("duplicate_rows_removed", 0)),
        missing_values_fixed=int(cleaning_summary.get("missing_values_fixed", 0)),
        status="completed",
    )
    uploaded.status = "reported"
    db.add(report)
    db.commit()
    db.refresh(report)
    log_activity(
        db,
        "report_generated",
        f"Report generated for {uploaded.original_filename}",
        current_user.email,
    )
    return report


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        saved_path = save_upload_file(file)
        df = read_dataframe(saved_path)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Could not process file: {exc}"
        ) from exc
    uploaded = UploadedFile(
        user_id=current_user.id,
        original_filename=file.filename or "uploaded_file",
        file_path=str(saved_path),
        row_count=int(len(df)),
        column_count=int(len(df.columns)),
        status="uploaded",
    )
    db.add(uploaded)
    db.commit()
    db.refresh(uploaded)
    log_activity(
        db,
        "file_uploaded",
        f"{current_user.email} uploaded {uploaded.original_filename}",
        current_user.email,
    )
    return {
        "file_id": uploaded.id,
        "original_filename": uploaded.original_filename,
        "row_count": uploaded.row_count,
        "column_count": uploaded.column_count,
        "columns": [str(c) for c in df.columns],
        "preview": dataframe_preview(df),
        "status": uploaded.status,
    }


@router.post("/{file_id}/clean", response_model=CleanResponse)
def clean_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded = get_owned_file(file_id, current_user, db)
    try:
        df = read_dataframe(uploaded.file_path)
        cleaned_df, summary = clean_dataframe(df)
        excel_path, csv_path = save_cleaned_files(
            cleaned_df, uploaded.original_filename
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Could not clean file: {exc}"
        ) from exc
    uploaded.cleaned_file_path = str(excel_path)
    uploaded.cleaned_csv_path = str(csv_path)
    uploaded.cleaning_summary_json = json.dumps(summary)
    uploaded.status = "cleaned"
    db.commit()
    db.refresh(uploaded)
    log_activity(
        db,
        "file_cleaned",
        f"{uploaded.original_filename} was cleaned",
        current_user.email,
    )
    return {
        "file_id": uploaded.id,
        "summary": summary,
        "preview": dataframe_preview(cleaned_df),
        "status": uploaded.status,
    }


@router.post("/{file_id}/generate-report", response_model=GenerateReportResponse)
def generate_report(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded = get_owned_file(file_id, current_user, db)
    try:
        report = create_report_for_uploaded_file(uploaded, current_user, db)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Could not generate report: {exc}"
        ) from exc
    return report_to_dict(report)


@router.post("/{file_id}/generate-and-email", response_model=GenerateAndEmailResponse)
def generate_and_email_report(
    file_id: int,
    payload: EmailReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """One-click automation: clean data, generate PDF, save report, and send it."""
    uploaded = get_owned_file(file_id, current_user, db)
    try:
        report = create_report_for_uploaded_file(uploaded, current_user, db)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Could not generate report: {exc}"
        ) from exc

    summary = safe_json_loads(report.summary_json)
    email_result = send_report_email(
        payload.recipient_email, report, summary, report.pdf_file_path
    )
    if email_result.get("sent"):
        report.email_sent = True
        db.commit()
        db.refresh(report)
        log_activity(
            db,
            "report_emailed",
            f"Report {report.id} auto-emailed to {payload.recipient_email}",
            current_user.email,
        )
    return {"report": report_to_dict(report), "email": email_result}
