from __future__ import annotations

import html as html_escape
import mimetypes
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
from typing import Any

from .analytics import browser_label

BRAND_NAME = os.getenv("APP_BRAND_NAME", "NoctraGrid Relay")
SMTP_EMAIL_NOT_CONFIGURED = (
    "Email service is not configured. Add SMTP_USERNAME and SMTP_APP_PASSWORD "
    "in backend .env/Railway variables. For Gmail, use a Google App Password, "
    "not your normal Gmail password."
)


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _smtp_password() -> str:
    password = _env("SMTP_APP_PASSWORD") or _env("SMTP_PASSWORD")
    if _env("SMTP_STRIP_PASSWORD_SPACES", "true").lower() != "false":
        password = password.replace(" ", "")
    return password


def smtp_config() -> dict[str, Any]:
    username = _env("SMTP_USERNAME") or _env("SMTP_FROM_EMAIL")
    from_email = _env("SMTP_FROM_EMAIL") or username
    return {
        "host": _env("SMTP_HOST", "smtp.gmail.com"),
        "port": int(_env("SMTP_PORT", "587") or 587),
        "username": username,
        "password": _smtp_password(),
        "from_email": from_email,
        "from_name": _env("SMTP_FROM_NAME", BRAND_NAME),
        "reply_to": _env("SMTP_REPLY_TO_EMAIL") or _env("OWNER_ALERT_EMAIL"),
        "use_ssl": _env("SMTP_USE_SSL", "false").lower() == "true",
        "use_tls": _env("SMTP_USE_TLS", "true").lower() != "false",
    }


def is_smtp_configured() -> bool:
    config = smtp_config()
    return bool(config["host"] and config["port"] and config["username"] and config["password"] and config["from_email"])


def owner_email_configured() -> bool:
    return is_smtp_configured() and bool(_env("OWNER_ALERT_EMAIL"))


def sender_address() -> str:
    config = smtp_config()
    return formataddr((config["from_name"], config["from_email"])) if config["from_name"] else config["from_email"]


def _attach_file(message: EmailMessage, path: str | Path, filename: str | None = None) -> bool:
    file_path = Path(path)
    if not file_path.exists() or not file_path.is_file():
        return False
    guessed_type, _ = mimetypes.guess_type(str(file_path))
    maintype, subtype = (guessed_type or "application/octet-stream").split("/", 1)
    message.add_attachment(
        file_path.read_bytes(),
        maintype=maintype,
        subtype=subtype,
        filename=filename or file_path.name,
    )
    return True


def send_smtp_email(
    to_email: str,
    subject: str,
    html: str,
    attachments: list[dict[str, str | Path]] | None = None,
    not_configured_message: str = SMTP_EMAIL_NOT_CONFIGURED,
    reply_to: str | None = None,
) -> dict[str, Any]:
    """Send a transactional email through Google/Gmail SMTP.

    The function intentionally uses Python's standard library so the project no
    longer depends on Render workers or third-party email APIs. Gmail works with
    SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USERNAME=<gmail>, and a Google
    App Password in SMTP_APP_PASSWORD.
    """
    if not is_smtp_configured():
        return {"sent": False, "message": not_configured_message}

    config = smtp_config()
    message = EmailMessage()
    message["From"] = sender_address()
    message["To"] = str(to_email)
    message["Subject"] = subject
    chosen_reply_to = (reply_to or config["reply_to"] or "").strip()
    if chosen_reply_to:
        message["Reply-To"] = chosen_reply_to
    message.set_content(
        "This email contains an HTML report summary. Please open it in an email client that supports HTML."
    )
    message.add_alternative(html, subtype="html")

    for attachment in attachments or []:
        path = attachment.get("path")
        if path and not _attach_file(message, path, str(attachment.get("filename") or Path(path).name)):
            return {
                "sent": False,
                "message": f"Attachment file was not found on the server: {path}",
            }

    try:
        context = ssl.create_default_context()
        if config["use_ssl"]:
            with smtplib.SMTP_SSL(config["host"], config["port"], context=context, timeout=30) as server:
                server.login(config["username"], config["password"])
                server.send_message(message)
        else:
            with smtplib.SMTP(config["host"], config["port"], timeout=30) as server:
                server.ehlo()
                if config["use_tls"]:
                    server.starttls(context=context)
                    server.ehlo()
                server.login(config["username"], config["password"])
                server.send_message(message)
        return {"sent": True, "message": "Email sent successfully via Gmail SMTP."}
    except smtplib.SMTPAuthenticationError:
        return {
            "sent": False,
            "message": "SMTP authentication failed. Check SMTP_USERNAME and Google App Password. Do not use your normal Gmail password.",
        }
    except Exception as exc:
        return {"sent": False, "message": f"Email could not be sent via SMTP: {exc}"}


def send_report_email(
    to_email: str, report: Any, summary: dict[str, Any], pdf_path: str | None = None
) -> dict[str, Any]:
    cards = summary.get("summary_cards", {})
    cleaning = summary.get("cleaning_summary", {})
    file_name = html_escape.escape(str(report.original_filename))
    html = f"""
    <div style="margin:0;background:#020617;padding:28px;font-family:Inter,Arial,sans-serif;color:#e5e7eb;line-height:1.6">
      <div style="max-width:720px;margin:auto;border:1px solid #1e293b;border-radius:24px;background:#0f172a;padding:30px;box-shadow:0 28px 80px rgba(0,0,0,.35)">
        <p style="margin:0 0 10px;color:#22d3ee;font-weight:900;letter-spacing:.12em;text-transform:uppercase">{BRAND_NAME}</p>
        <h1 style="margin:0 0 14px;color:#fff;font-size:30px;line-height:1.15">Your automated PDF intelligence pack is ready</h1>
        <p style="margin:0 0 18px;color:#cbd5e1">Hi, your spreadsheet was cleaned, converted into a professional PDF report, and delivered automatically by the SMTP relay. The PDF is attached to this email.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#111827;border-radius:16px;overflow:hidden">
          <tr><td style="padding:13px;border-bottom:1px solid #334155;color:#94a3b8">File processed</td><td style="padding:13px;border-bottom:1px solid #334155;color:#fff;font-weight:800">{file_name}</td></tr>
          <tr><td style="padding:13px;border-bottom:1px solid #334155;color:#94a3b8">Rows cleaned</td><td style="padding:13px;border-bottom:1px solid #334155;color:#fff;font-weight:800">{cards.get('total_rows', report.rows_processed)}</td></tr>
          <tr><td style="padding:13px;border-bottom:1px solid #334155;color:#94a3b8">Duplicates removed</td><td style="padding:13px;border-bottom:1px solid #334155;color:#fff;font-weight:800">{cleaning.get('duplicate_rows_removed', report.duplicates_removed)}</td></tr>
          <tr><td style="padding:13px;color:#94a3b8">Missing values fixed</td><td style="padding:13px;color:#fff;font-weight:800">{cleaning.get('missing_values_fixed', report.missing_values_fixed)}</td></tr>
        </table>
        <p style="margin-top:22px;color:#94a3b8">Thanks,<br/><strong style="color:#e2e8f0">{BRAND_NAME}</strong></p>
      </div>
    </div>
    """
    attachments: list[dict[str, str | Path]] = []
    if pdf_path:
        file_path = Path(pdf_path)
        if not file_path.exists() or not file_path.is_file():
            return {
                "sent": False,
                "message": "Report PDF file was not found on the server. Generate the report again, then retry email.",
            }
        attachments.append({"path": file_path, "filename": f"noctragrid-report-{report.id}.pdf"})
    return send_smtp_email(
        str(to_email),
        "Your NoctraGrid PDF report is ready",
        html,
        attachments or None,
        SMTP_EMAIL_NOT_CONFIGURED,
    )


def send_owner_visitor_alert(page: str, user_agent: str | None) -> dict[str, Any]:
    if not owner_email_configured():
        return {"sent": False, "message": "Owner visitor alert email is not configured."}
    safe_page = html_escape.escape(page or "Landing Page")
    safe_browser = html_escape.escape(browser_label(user_agent))
    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2>New visitor on {BRAND_NAME}</h2>
      <p>Someone visited your demo landing page.</p>
      <p><strong>Page:</strong> {safe_page}</p>
      <p><strong>Browser:</strong> {safe_browser}</p>
    </div>
    """
    return send_smtp_email(
        _env("OWNER_ALERT_EMAIL"),
        f"New visitor on {BRAND_NAME}",
        html,
        not_configured_message="Owner visitor alert email is not configured.",
    )


def send_owner_lead_alert(
    name: str, email: str, company_role: str | None, message: str
) -> dict[str, Any]:
    if not owner_email_configured():
        return {"sent": False, "message": "Owner lead alert email is not configured."}
    safe_name = html_escape.escape(name.strip())
    safe_email = html_escape.escape(email.strip())
    safe_role = html_escape.escape((company_role or "Not provided").strip() or "Not provided")
    safe_message = html_escape.escape(message.strip()).replace("\n", "<br/>")
    html = f"""
    <div style="margin:0;background:#020617;padding:24px;font-family:Inter,Arial,sans-serif;color:#e5e7eb;line-height:1.6">
      <div style="max-width:680px;margin:auto;border:1px solid #1e293b;border-radius:20px;background:#0f172a;padding:24px">
        <p style="margin:0 0 10px;color:#22d3ee;font-weight:900;letter-spacing:.12em;text-transform:uppercase">New lead</p>
        <h2 style="margin:0 0 12px;color:white">New {BRAND_NAME} contact message</h2>
        <p><strong>Name:</strong> {safe_name}</p>
        <p><strong>Email:</strong> {safe_email}</p>
        <p><strong>Company/Role:</strong> {safe_role}</p>
        <p><strong>Message:</strong><br/>{safe_message}</p>
      </div>
    </div>
    """
    return send_smtp_email(
        _env("OWNER_ALERT_EMAIL"),
        f"New NoctraGrid lead from {safe_name}",
        html,
        not_configured_message="Owner lead alert email is not configured.",
        reply_to=email,
    )
