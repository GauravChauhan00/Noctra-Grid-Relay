import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/helpers.js";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, adminLogin } = useAuth();
  const [mode, setMode] = useState("user");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const signedInUser =
        mode === "admin"
          ? await adminLogin(form.email, form.password)
          : await signup(form.name, form.email, form.password);
      navigate(signedInUser.is_admin ? "/analytics" : "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = mode === "admin";

  return (
    <main className="auth-shell">
      <section className="auth-card glass-panel wide-auth">
        <Link className="brand-mark auth-brand" to="/">
          <span className="brand-icon">NG</span>
          <span>NoctraGrid Relay</span>
        </Link>

        <div className="auth-tabs" role="tablist" aria-label="Signup or admin login">
          <button
            type="button"
            className={!isAdmin ? "active" : ""}
            onClick={() => setMode("user")}
          >
            ✦ User Sign Up
          </button>
          <button
            type="button"
            className={isAdmin ? "active" : ""}
            onClick={() => setMode("admin")}
          >
            🛡 Admin Login
          </button>
        </div>

        <span className="eyebrow">
          {isAdmin ? "Admin owner" : "Create workspace"}
        </span>
        <h1>{isAdmin ? "Use owner credentials from backend env" : "Start cleaning Excel reports in minutes"}</h1>
        <p className="auth-intro">
          {isAdmin
            ? "Only the configured ADMIN_EMAIL account becomes admin. Change it from backend .env or Railway variables anytime."
            : "Normal users get upload, clean, report, email, and history features without admin analytics access."}
        </p>

        <form onSubmit={handleSubmit}>
          {!isAdmin && (
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          <label>
            {isAdmin ? "Admin ID / Email" : "Email"}
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={isAdmin ? undefined : 6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <p className="form-status error">{error}</p>}
          <button className="primary-button full" disabled={loading}>
            {loading
              ? isAdmin
                ? "Checking admin..."
                : "Creating account..."
              : isAdmin
                ? "Login as Admin"
                : "Create User Account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
