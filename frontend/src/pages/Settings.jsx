import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../utils/helpers.js";
export default function Settings() {
  const { user } = useAuth();
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Identity core</span>
          <h1>Relay workspace settings</h1>
          <p>
            Profile view for JWT authentication, user scope, and admin role explanation.
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
            {user?.is_admin ? "Admin owner" : "Normal user"}
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
            <span>API Base URL</span>
            <strong>
              {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
            </strong>
          </div>
        </article>
        <article className="glass-panel settings-card full-width">
          <h3>Admin privacy model</h3>
          <p>
            Normal users can upload files, generate reports, email their own
            reports, and view only their own history. Admin users get one extra
            Analytics route. Backend dependencies still protect the analytics
            APIs with 403 Forbidden for non-admin users.
          </p>
        </article>
      </section>
    </div>
  );
}
