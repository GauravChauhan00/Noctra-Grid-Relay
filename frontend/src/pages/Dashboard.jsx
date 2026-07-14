import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios.js";
import ChartPanel from "../components/ChartPanel.jsx";
import PipelineSteps from "../components/PipelineSteps.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatDate, formatNumber, getSessionId } from "../utils/helpers.js";
import { axisProps, gridProps, tooltipProps } from "../utils/chartTheme.js";
export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/api/reports")
      .then(({ data }) => setReports(data))
      .finally(() => setLoading(false));
    api
      .post("/api/analytics/visit", {
        page: "Dashboard",
        anonymous_session_id: getSessionId(),
        user_agent: navigator.userAgent,
      })
      .catch(() => {});
  }, []);
  const stats = useMemo(
    () =>
      reports.reduce(
        (a, r) => {
          a.rows += r.rows_processed || 0;
          a.duplicates += r.duplicates_removed || 0;
          a.missing += r.missing_values_fixed || 0;
          a.emailed += r.email_sent ? 1 : 0;
          return a;
        },
        { rows: 0, duplicates: 0, missing: 0, emailed: 0 },
      ),
    [reports],
  );
  const chartData = reports
    .slice(0, 7)
    .reverse()
    .map((r) => ({
      name: `#${r.id}`,
      rows: r.rows_processed,
      duplicates: r.duplicates_removed,
    }));
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Command deck</span>
          <h1>NoctraGrid relay overview</h1>
          <p>
            Track uploads, cleaned rows, report vault activity, downloads, and Gmail SMTP delivery status from one dark control surface.
          </p>
        </div>
        <Link className="primary-button" to="/upload">
          Run New Relay
        </Link>
      </header>
      <section className="stats-grid">
        <StatCard
          label="Reports Generated"
          value={formatNumber(reports.length)}
          hint="Saved in history"
        />
        <StatCard
          label="Rows Processed"
          value={formatNumber(stats.rows)}
          hint="Across your reports"
          accent="emerald"
        />
        <StatCard
          label="Duplicates Removed"
          value={formatNumber(stats.duplicates)}
          hint="Data quality wins"
          accent="violet"
        />
        <StatCard
          label="SMTP Emails Sent"
          value={formatNumber(stats.emailed)}
          hint="Via Gmail SMTP"
          accent="amber"
        />
      </section>
      <section className="glass-panel workflow-panel">
        <div className="panel-heading">
          <div>
            <h3>Relay automation pipeline</h3>
            <p>Every report follows the same upload-to-inbox workflow.</p>
          </div>
        </div>
        <PipelineSteps currentStep={reports.length ? 4 : 0} />
      </section>
      <div className="dashboard-grid-two">
        <ChartPanel
          title="Recent relay volume"
          subtitle="Rows and duplicates by report"
          empty={!chartData.length}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="rows" fill="var(--green)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="duplicates" fill="var(--teal)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="glass-panel recent-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent reports</h3>
              <p>Only your own reports appear here.</p>
            </div>
            <Link to="/history">View all</Link>
          </div>
          {loading ? (
            <div className="skeleton-list" />
          ) : (
            reports.slice(0, 5).map((report) => (
              <Link
                className="recent-row"
                key={report.id}
                to={`/reports/${report.id}`}
              >
                <span>{report.original_filename}</span>
                <small>{formatDate(report.created_at)}</small>
                <b>{report.status}</b>
              </Link>
            ))
          )}
          {!loading && reports.length === 0 && (
            <div className="empty-state">
              No reports yet. Upload a sample Excel file to begin.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
