from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from ..models import Report, User
from ..schemas import GenerateReportResponse
from ..utils.analytics import log_activity
from ..utils.serializers import report_to_dict

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", response_model=list[GenerateReportResponse])
def history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return [
        report_to_dict(r)
        for r in db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    ]


@router.delete("/{report_id}")
def delete_history_item(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    for path_value in [
        report.pdf_file_path,
        report.cleaned_file_path,
        report.cleaned_csv_path,
    ]:
        if path_value:
            path = Path(path_value)
            if path.exists():
                path.unlink(missing_ok=True)
    db.delete(report)
    db.commit()
    log_activity(
        db, "report_deleted", f"Report {report_id} deleted", current_user.email
    )
    return {"message": "Report deleted successfully"}
