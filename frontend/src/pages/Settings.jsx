import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../utils/helpers.js";
export default function Settings() {
  const { user } = useAuth();
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>Account & security</h1>
          <p>
            Manage your account credentials, security settings, and platform privileges.
          </p>
        </div>
      </header>
      <section className="settings-grid">
        <article className="glass-panel profile-card">
          <div className="avatar large">
            {user?.name?.slice(0, 1)?.toUpperCase()}
          </div>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <span className="status-pill">
            {user?.is_admin ? "Administrator" : "Member"}
          </span>
        </article>
        <article className="glass-panel settings-card">
          <h3>Account details</h3>
          <div className="settings-row">
            <span>User ID</span>
            <strong>{user?.id}</strong>
          </div>
          <div className="settings-row">
            <span>Created</span>
            <strong>{formatDate(user?.created_at)}</strong>
          </div>
          <div className="settings-row">
            <span>Admin Access</span>
            <strong>{user?.is_admin ? "Enabled" : "Disabled"}</strong>
          </div>
          <div className="settings-row">
            <span>API Server Status</span>
            <strong>Connected</strong>
          </div>
        </article>
        <article className="glass-panel settings-card full-width">
          <h3>Access Control Model</h3>
          <p>
            Members can upload files, process reports, send emails, and view their individual data pipeline history. Administrative users have access to system-wide dashboards, logs, and user management tools. Access to sensitive data is protected via secure server-side authorization.
          </p>
        </article>
      </section>
    </div>
  );
}
