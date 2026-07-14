import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import {
  downloadReportFile,
  formatDate,
  getErrorMessage,
} from "../utils/helpers.js";
export default function History() {
  const [reports, setReports] = useState([]),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(null);
  useEffect(() => {
    api
      .get("/api/history")
      .then(({ data }) => setReports(data))
      .finally(() => setLoading(false));
  }, []);
  async function deleteReport(id) {
    if (!confirm("Delete this report history item?")) return;
    try {
      await api.delete(`/api/history/${id}`);
      setReports((items) => items.filter((i) => i.id !== id));
      setMessage({ type: "success", text: "Report deleted." });
    } catch (e) {
      setMessage({ type: "error", text: getErrorMessage(e) });
    }
  }
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Report vault</span>
          <h1>Your saved relay runs</h1>
          <p>Only reports created by your logged-in account are visible in this vault.</p>
        </div>
        <Link className="primary-button" to="/upload">
          Run More
        </Link>
      </header>
      {message && (
        <p className={`form-status ${message.type}`}>{message.text}</p>
      )}
      <section className="glass-panel">
        {loading ? (
          <div className="skeleton-list large" />
        ) : reports.length === 0 ? (
          <div className="empty-state">
            No report history yet. Upload a file and generate your first report.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table history-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>Duplicates</th>
                  <th>Missing Fixed</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <Link to={`/reports/${report.id}`}>
                        {report.original_filename}
                      </Link>
                    </td>
                    <td>{formatDate(report.created_at)}</td>
                    <td>
                      <span className="status-pill">{report.status}</span>
                    </td>
                    <td>{report.rows_processed}</td>
                    <td>{report.duplicates_removed}</td>
                    <td>{report.missing_values_fixed}</td>
                    <td>{report.email_sent ? "Sent" : "Not sent"}</td>
                    <td className="table-actions">
                      <button
                        onClick={() => downloadReportFile(report.id, "pdf")}
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => downloadReportFile(report.id, "excel")}
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => downloadReportFile(report.id, "csv")}
                      >
                        CSV
                      </button>
                      <button
                        className="danger"
                        onClick={() => deleteReport(report.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
