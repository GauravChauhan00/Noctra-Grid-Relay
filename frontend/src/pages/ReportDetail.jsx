import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios.js";
import ChartPanel from "../components/ChartPanel.jsx";
import StatCard from "../components/StatCard.jsx";
import {
  downloadReportFile,
  formatDate,
  formatNumber,
  getErrorMessage,
} from "../utils/helpers.js";
import { axisProps, gridProps, legendProps, tooltipProps } from "../utils/chartTheme.js";
const COLORS = [
  "#2563eb",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];
function PreviewTable({ rows }) {
  if (!rows?.length)
    return <div className="empty-state">No preview data available.</div>;
  const columns = Object.keys(rows[0]).slice(0, 8);
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
export default function ReportDetail() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null),
    [loading, setLoading] = useState(true),
    [email, setEmail] = useState(""),
    [message, setMessage] = useState(null),
    [sending, setSending] = useState(false);
  useEffect(() => {
    api
      .get(`/api/reports/${reportId}`)
      .then(({ data }) => setReport(data))
      .catch((e) => setMessage({ type: "error", text: getErrorMessage(e) }))
      .finally(() => setLoading(false));
  }, [reportId]);
  async function handleEmail(e) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const { data } = await api.post(`/api/reports/${reportId}/email`, {
        recipient_email: email,
      });
      setMessage({ type: data.sent ? "success" : "info", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  }
  if (loading)
    return (
      <div className="screen-loader">
        <div className="loader-orb" />
        <p>Loading report...</p>
      </div>
    );
  if (!report) return <div className="empty-state">Report not found.</div>;
  const summary = report.summary || {},
    cards = summary.summary_cards || {},
    chartData = summary.chart_data || {};
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Report details</span>
          <h1>{summary.report_title || report.original_filename}</h1>
          <p>
            Created {formatDate(report.created_at)} · Status: {report.status}
          </p>
        </div>
        <Link className="secondary-button" to="/history">
          Back to History
        </Link>
      </header>
      <section className="stats-grid">
        <StatCard label="Total Rows" value={formatNumber(cards.total_rows)} />
        <StatCard
          label="Total Columns"
          value={formatNumber(cards.total_columns)}
          accent="emerald"
        />
        <StatCard
          label="Duplicates Removed"
          value={formatNumber(cards.duplicates_removed)}
          accent="violet"
        />
        <StatCard
          label="Missing Values Fixed"
          value={formatNumber(cards.missing_values_fixed)}
          accent="amber"
        />
      </section>
      <section className="glass-panel report-actions">
        <button onClick={() => downloadReportFile(report.id, "pdf", report.original_filename)}>
          Download PDF
        </button>
        <button onClick={() => downloadReportFile(report.id, "excel", report.original_filename)}>
          Download Cleaned Excel
        </button>
        <button onClick={() => downloadReportFile(report.id, "csv", report.original_filename)}>
          Download CSV
        </button>
        <form onSubmit={handleEmail} className="inline-form compact">
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="primary-button" disabled={sending}>
            {sending ? "Sending..." : "Email PDF"}
          </button>
        </form>
      </section>
      {message && (
        <p className={`form-status ${message.type}`}>{message.text}</p>
      )}
      <div className="dashboard-grid-two">
        <ChartPanel
          title="Top category distribution"
          subtitle="First categorical column"
          empty={!chartData.category_bar?.length}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData.category_bar || []}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel
          title="Category share"
          subtitle="Pie chart distribution"
          empty={!chartData.pie_data?.length}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData.pie_data || []}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={4}
              >
                {(chartData.pie_data || []).map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
      <ChartPanel
        title="Date trend"
        subtitle="First detected date column + first numeric column"
        empty={!chartData.line_data?.length}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.line_data || []}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipProps} />
            <Line dataKey="value" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
      <section className="glass-panel insights-panel">
        <div className="panel-heading">
          <div>
            <h3>Key findings & insights</h3>
            <p>Automatically identified trends and key data markers from the processed dataset.</p>
          </div>
        </div>
        <div className="insight-list">
          {(summary.insights || []).map((insight) => (
            <p key={insight}>✦ {insight}</p>
          ))}
        </div>
      </section>
      <section className="glass-panel">
        <div className="panel-heading">
          <div>
            <h3>Data preview</h3>
            <p>First rows from the cleaned dataset.</p>
          </div>
        </div>
        <PreviewTable rows={summary.preview} />
      </section>
    </div>
  );
}
