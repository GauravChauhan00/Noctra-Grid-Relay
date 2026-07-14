import { useEffect, useState } from "react";
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
import StatCard from "../components/StatCard.jsx";
import { formatDate, formatNumber, getErrorMessage } from "../utils/helpers.js";
import { axisProps, gridProps, tooltipProps } from "../utils/chartTheme.js";

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [activity, setActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      const [s, l, v, a, u, r] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/leads"),
        api.get("/api/analytics/visits"),
        api.get("/api/admin/activity"),
        api.get("/api/admin/users"),
        api.get("/api/admin/reports"),
      ]);
      setSummary(s.data);
      setLeads(l.data);
      setVisits(v.data);
      setActivity(a.data);
      setUsers(u.data);
      setReports(r.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteUser(id) {
    if (!confirm("Delete this user and related records?")) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers((items) => items.filter((item) => item.id !== id));
      setReports((items) => items.filter((item) => item.user_id !== id));
      setMessage({ type: "success", text: "User deleted by admin." });
      load();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function deleteReport(id) {
    if (!confirm("Delete this report from admin panel?")) return;
    try {
      await api.delete(`/api/admin/reports/${id}`);
      setReports((items) => items.filter((item) => item.id !== id));
      setMessage({ type: "success", text: "Report deleted by admin." });
      load();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  if (error)
    return (
      <section className="access-denied glass-panel">
        <span className="eyebrow">Admin analytics</span>
        <h1>{error}</h1>
      </section>
    );

  if (!summary)
    return (
      <div className="screen-loader">
        <div className="loader-orb" />
        <p>Loading private analytics...</p>
      </div>
    );

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">🛡 Private owner console</span>
          <h1>Admin control center</h1>
          <p>
            View visits, leads, all users, all reports, email status, and every important platform activity. These APIs are protected by backend admin checks.
          </p>
        </div>
      </header>

      {message && (
        <p className={`form-status ${message.type}`}>{message.text}</p>
      )}

      <section className="stats-grid admin-stats">
        <StatCard
          label="Website Visits"
          value={formatNumber(summary.total_visitors)}
          hint={`${formatNumber(summary.total_sessions)} sessions`}
        />
        <StatCard
          label="Leads"
          value={formatNumber(summary.total_leads)}
          accent="emerald"
        />
        <StatCard
          label="Users"
          value={formatNumber(summary.total_users)}
          accent="violet"
        />
        <StatCard
          label="Reports"
          value={formatNumber(summary.total_reports)}
          accent="amber"
        />
        <StatCard
          label="Emails Sent"
          value={formatNumber(summary.emails_sent)}
          hint="Reports + alerts"
        />
      </section>

      <div className="dashboard-grid-two">
        <ChartPanel
          title="Most visited pages"
          subtitle="Anonymous page visits"
          empty={!summary.most_visited_pages?.length}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.most_visited_pages || []}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="page" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="visits" fill="var(--green)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="glass-panel activity-panel">
          <div className="panel-heading">
            <div>
              <h3>⚡ Recent platform activity</h3>
              <p>Who did what: uploads, reports, emails, lead submissions, and auth events.</p>
            </div>
          </div>
          {activity.slice(0, 10).map((item) => (
            <div className="activity-row" key={item.id}>
              <span>{item.event_type}</span>
              <p>{item.description}</p>
              <small>
                {item.actor_email || "system"} · {formatDate(item.created_at)}
              </small>
            </div>
          ))}
        </section>
      </div>

      <section className="glass-panel">
        <div className="panel-heading">
          <div>
            <h3>👥 User management</h3>
            <p>Admin can see all accounts, upload counts, report counts, and remove normal users.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Uploads</th>
                <th>Reports</th>
                <th>Joined</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="status-pill">
                      {user.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>{user.uploads_count}</td>
                  <td>{user.reports_count}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td className="table-actions">
                    <button
                      className="danger"
                      disabled={user.is_admin}
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel">
        <div className="panel-heading">
          <div>
            <h3>🧾 Report management</h3>
            <p>Admin can review which user generated each report and remove reports when needed.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>User</th>
                <th>Rows</th>
                <th>Duplicates</th>
                <th>Email</th>
                <th>Created</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.original_filename}</td>
                  <td>
                    {report.user_name}
                    <br />
                    <small>{report.user_email}</small>
                  </td>
                  <td>{report.rows_processed}</td>
                  <td>{report.duplicates_removed}</td>
                  <td>{report.email_sent ? "Sent" : "Not sent"}</td>
                  <td>{formatDate(report.created_at)}</td>
                  <td className="table-actions">
                    <button className="danger" onClick={() => deleteReport(report.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel">
        <div className="panel-heading">
          <div>
            <h3>📩 Recent leads</h3>
            <p>Contact/walkthrough form submissions. These also email the owner when Gmail SMTP is configured.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company/Role</th>
                <th>Message</th>
                <th>Submitted At</th>
                <th>Alert</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.company_role || "—"}</td>
                  <td>{lead.message}</td>
                  <td>{formatDate(lead.created_at)}</td>
                  <td>{lead.alert_sent ? "Sent" : "Not sent"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel">
        <div className="panel-heading">
          <div>
            <h3>🌐 Recent anonymous visits</h3>
            <p>Safe basic analytics only. No exact location or sensitive data.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Visited At</th>
                <th>Browser/User Agent</th>
                <th>Session</th>
                <th>Alert Sent</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.page}</td>
                  <td>{formatDate(visit.visited_at)}</td>
                  <td className="truncate-cell">{visit.user_agent}</td>
                  <td>{visit.anonymous_session_id?.slice(0, 18)}...</td>
                  <td>{visit.alert_sent ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
