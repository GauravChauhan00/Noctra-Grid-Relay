import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const baseLinks = [
  { to: "/dashboard", label: "Command Deck", icon: "✦" },
  { to: "/upload", label: "SMTP Relay", icon: "⇪" },
  { to: "/history", label: "Report Vault", icon: "◈" },
  { to: "/settings", label: "Identity Core", icon: "⚙" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() {
    logout();
    navigate("/");
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-radar" />
      <Link to="/dashboard" className="sidebar-brand">
        <span className="brand-icon">NG</span>
        <span>
          <strong>NoctraGrid</strong>
          <small>Relay Console</small>
        </span>
      </Link>
      <div className="sidebar-user">
        <div className="avatar">
          {user?.name?.slice(0, 1)?.toUpperCase() || "U"}
        </div>
        <div>
          <strong>{user?.name}</strong>
          <small>{user?.is_admin ? "Admin owner" : "Workspace user"}</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {baseLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span>{link.icon}</span>
            <b>{link.label}</b>
          </NavLink>
        ))}
        {user?.is_admin && (
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? "active admin-link" : "admin-link"
            }
          >
            <span>🛡</span><b>Owner Console</b>
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="relay-health-card">
          <small>Relay stack</small>
          <strong>Upload → Clean → PDF → SMTP</strong>
          <div className="mini-pipeline">
            <span>Excel</span>
            <i />
            <span>Report</span>
            <i />
            <span>Inbox</span>
          </div>
        </div>
        <button className="ghost-button full" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
