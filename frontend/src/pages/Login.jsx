import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { getErrorMessage, getSessionId } from "../utils/helpers.js";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, adminLogin } = useAuth();
  const [role, setRole] = useState(
    searchParams.get("role") === "admin" ? "admin" : "user",
  );
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReadOnly(false);
    }, 150);

    api
      .post("/api/analytics/visit", {
        page: "Login Page",
        anonymous_session_id: getSessionId(),
        user_agent: navigator.userAgent,
      })
      .catch(() => {});

    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const signedInUser =
        role === "admin"
          ? await adminLogin(form.email, form.password)
          : await login(form.email, form.password);
      navigate(signedInUser.is_admin ? "/analytics" : "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = role === "admin";

  return (
    <main className="auth-shell">
      <section className="auth-card glass-panel">
        <Link className="brand-mark auth-brand" to="/">
          <span className="brand-icon">NG</span>
          <span>NoctraGrid Relay</span>
        </Link>

        <div className="auth-tabs" role="tablist" aria-label="Login type">
          <button
            type="button"
            className={role === "user" ? "active" : ""}
            onClick={() => setRole("user")}
          >
            👤 User Login
          </button>
          <button
            type="button"
            className={role === "admin" ? "active" : ""}
            onClick={() => setRole("admin")}
          >
            🛡 Admin Login
          </button>
        </div>

        <span className="eyebrow">
          {isAdmin ? "Owner access" : "Welcome back"}
        </span>
        <h1>{isAdmin ? "Admin Portal Login" : "Log in to your workspace"}</h1>
        <p className="auth-intro">
          {isAdmin
            ? "Admin login is restricted to authorized platform administrators. Regular users cannot access system-wide analytics or configurations."
            : "Log in to your workspace to upload files, generate reports, and manage your delivery pipelines."}
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            {isAdmin ? "Admin ID / Email" : "Email"}
            <input
              type="email"
              required
              autoComplete="email"
              readOnly={isReadOnly}
              onFocus={() => setIsReadOnly(false)}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              readOnly={isReadOnly}
              onFocus={() => setIsReadOnly(false)}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <p className="form-status error">{error}</p>}
          <button className="primary-button full" disabled={loading}>
            {loading
              ? isAdmin
                ? "Checking admin..."
                : "Logging in..."
              : isAdmin
                ? "Login as Admin"
                : "Login as User"}
          </button>
        </form>
        <p className="auth-switch">
          Need a user account? <Link to="/signup">Create user account</Link>
        </p>
      </section>
    </main>
  );
}
