# NoctraGrid Relay Changelog

## Current build

- Rebranded project to **NoctraGrid Relay**.
- Added premium tagline: **Obsidian-grade spreadsheet intelligence that cleans, reports, and delivers itself.**
- Removed Resend-style email implementation.
- Added Gmail App Password SMTP implementation in `backend/app/utils/email_service.py`.
- Added one-click automation endpoint: `POST /api/files/{file_id}/generate-and-email`.
- Updated Upload UI with **Generate PDF + Auto Email** flow.
- Fixed Recharts dark-mode tooltip/hover visibility through `frontend/src/utils/chartTheme.js` and CSS overrides.
- Redesigned left sidebar as a premium relay console.
- Redesigned landing top/right nav as a glass tray.
- Rewrote documentation in `docs/NOCTRAGRID_RELAY_COMPLETE_DOCUMENTATION_HINGLISH.md`.
- Sanitized frontend package lock registry URLs.
