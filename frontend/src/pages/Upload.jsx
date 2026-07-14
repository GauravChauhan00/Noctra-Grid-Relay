import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import UploadBox from "../components/UploadBox.jsx";
import PipelineSteps from "../components/PipelineSteps.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  downloadReportFile,
  getErrorMessage,
  formatNumber,
} from "../utils/helpers.js";

function PreviewTable({ rows }) {
  if (!rows?.length) return null;
  const columns = Object.keys(rows[0]);
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c}>{String(row[c] ?? "—")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null),
    [uploadResult, setUploadResult] = useState(null),
    [cleanResult, setCleanResult] = useState(null),
    [report, setReport] = useState(null),
    [progress, setProgress] = useState(0),
    [loading, setLoading] = useState(""),
    [message, setMessage] = useState(null),
    [email, setEmail] = useState(user?.email || ""),
    [emailSent, setEmailSent] = useState(false);

  const currentStep = emailSent
    ? 4
    : report
      ? 2
      : cleanResult
        ? 1
        : uploadResult
          ? 0
          : -1;

  async function handleUpload() {
    if (!file)
      return setMessage({
        type: "error",
        text: "Please choose a .xlsx or .csv file first.",
      });
    const formData = new FormData();
    formData.append("file", file);
    setLoading("upload");
    setMessage(null);
    setProgress(0);
    try {
      const { data } = await api.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      setUploadResult(data);
      setCleanResult(null);
      setReport(null);
      setEmailSent(false);
      setMessage({
        type: "success",
        text: "File uploaded. Enter recipient email and run the SMTP auto-delivery pipeline.",
      });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoading("");
    }
  }

  async function handleClean() {
    if (!uploadResult) return;
    setLoading("clean");
    setMessage(null);
    try {
      const { data } = await api.post(
        `/api/files/${uploadResult.file_id}/clean`,
      );
      setCleanResult(data);
      setMessage({ type: "success", text: "Data cleaned successfully." });
    } catch (e) {
      setMessage({ type: "error", text: getErrorMessage(e) });
    } finally {
      setLoading("");
    }
  }

  async function handleGenerateReport() {
    if (!uploadResult) return;
    setLoading("report");
    setMessage(null);
    try {
      const { data } = await api.post(
        `/api/files/${uploadResult.file_id}/generate-report`,
      );
      setReport(data);
      setEmailSent(false);
      setMessage({
        type: "success",
        text: "Report generated and saved in history. You can now download or email it.",
      });
    } catch (e) {
      setMessage({ type: "error", text: getErrorMessage(e) });
    } finally {
      setLoading("");
    }
  }

  async function handleAutoWorkflow(e) {
    e.preventDefault();
    if (!uploadResult) {
      setMessage({ type: "error", text: "Upload a spreadsheet first." });
      return;
    }
    setLoading("auto-email");
    setMessage(null);
    try {
      const { data } = await api.post(
        `/api/files/${uploadResult.file_id}/generate-and-email`,
        { recipient_email: email },
      );
      setReport(data.report);
      setEmailSent(Boolean(data.email?.sent));
      setMessage({
        type: data.email?.sent ? "success" : "info",
        text: data.email?.sent
          ? "PDF generated, saved in history, and automatically sent to the recipient email."
          : data.email?.message || "Report generated, but email could not be sent.",
      });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading("");
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    if (!report) return;
    setLoading("email");
    setMessage(null);
    try {
      const { data } = await api.post(`/api/reports/${report.id}/email`, {
        recipient_email: email,
      });
      if (data.sent) setEmailSent(true);
      setMessage({ type: data.sent ? "success" : "info", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading("");
    }
  }

  const summary = cleanResult?.summary || report?.summary?.cleaning_summary;
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">⚡ SMTP relay workflow</span>
          <h1>Upload once. Enter email. PDF delivers itself.</h1>
          <p>
            Upload any .xlsx or .csv, then run the one-click automation that cleans data, generates a PDF report, saves history, and sends the PDF through Google App Password SMTP.
          </p>
        </div>
      </header>
      <section className="glass-panel workflow-panel">
        <PipelineSteps currentStep={currentStep} />
      </section>
      <section className="upload-layout">
        <div className="glass-panel upload-card">
          <UploadBox
            selectedFile={file}
            onFileSelect={setFile}
            progress={progress}
            uploading={loading === "upload"}
          />
          <button
            className="primary-button full"
            onClick={handleUpload}
            disabled={loading === "upload"}
          >
            {loading === "upload" ? "Uploading..." : "Upload File"}
          </button>
          {message && (
            <p className={`form-status ${message.type}`}>{message.text}</p>
          )}
        </div>
        <div className="glass-panel action-card relay-card">
          <span className="eyebrow">✉ Gmail SMTP auto-send</span>
          <h3>Generate PDF & email automatically</h3>
          <p>
            The user only needs to enter the recipient email. Backend will clean, generate, attach, send, and update history in one protected API call.
          </p>
          <form onSubmit={handleAutoWorkflow} className="relay-form">
            <label>
              Recipient email
              <input
                type="email"
                required
                placeholder="recipient@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              className="primary-button full"
              disabled={!uploadResult || loading === "auto-email"}
            >
              {loading === "auto-email" ? "Generating & sending..." : "Generate PDF + Auto Email"}
            </button>
          </form>
          <div className="automation-divider"><span>Advanced controls</span></div>
          <button
            className="secondary-button full"
            disabled={!uploadResult || loading === "clean"}
            onClick={handleClean}
          >
            {loading === "clean" ? "Cleaning..." : "Clean Data Only"}
          </button>
          <button
            className="secondary-button full"
            disabled={!uploadResult || loading === "report"}
            onClick={handleGenerateReport}
          >
            {loading === "report" ? "Generating..." : "Generate Report Only"}
          </button>
          {report && (
            <div className="download-grid">
              <button onClick={() => downloadReportFile(report.id, "pdf")}>
                Download PDF
              </button>
              <button onClick={() => downloadReportFile(report.id, "excel")}>
                Download Excel
              </button>
              <button onClick={() => downloadReportFile(report.id, "csv")}>
                Download CSV
              </button>
              <Link to={`/reports/${report.id}`}>View Report</Link>
            </div>
          )}
        </div>
      </section>
      {summary && (
        <section className="stats-grid">
          <StatCard
            label="Rows Before"
            value={formatNumber(summary.total_rows_before)}
          />
          <StatCard
            label="Rows After"
            value={formatNumber(summary.total_rows_after)}
            accent="emerald"
          />
          <StatCard
            label="Duplicates Removed"
            value={formatNumber(summary.duplicate_rows_removed)}
            accent="violet"
          />
          <StatCard
            label="Missing Fixed"
            value={formatNumber(summary.missing_values_fixed)}
            accent="amber"
          />
        </section>
      )}
      {(uploadResult || cleanResult) && (
        <section className="glass-panel">
          <div className="panel-heading">
            <div>
              <h3>
                {cleanResult ? "Cleaned data preview" : "Uploaded file preview"}
              </h3>
              <p>{uploadResult?.original_filename}</p>
            </div>
          </div>
          <PreviewTable rows={cleanResult?.preview || uploadResult?.preview} />
        </section>
      )}
      {report && (
        <section className="glass-panel email-panel">
          <div>
            <h3>✉ Send this PDF again</h3>
            <p>
              Uses your configured Gmail SMTP sender. The PDF report is attached and sent to the recipient email.
            </p>
          </div>
          <form onSubmit={handleEmail} className="inline-form">
            <input
              type="email"
              required
              placeholder="recipient@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="primary-button" disabled={loading === "email"}>
              {loading === "email" ? "Sending..." : "Send Again"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
