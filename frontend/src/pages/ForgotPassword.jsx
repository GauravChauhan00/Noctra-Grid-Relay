import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { getErrorMessage } from "../utils/helpers.js";

// Step 1: Enter email → get OTP
// Step 2: Enter 6-digit OTP
// Step 3: Enter new password

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Resend code countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  function startResendCountdown() {
    setResendTimer(30);
  }

  async function handleRequestOTP(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      setSuccess(data.message);
      setStep(2);
      startResendCountdown();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOTP() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      setSuccess(data.message);
      startResendCountdown();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/verify-otp", { email, otp_code: otp });
      setStep(3);
      setSuccess("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/api/auth/reset-password", {
        email,
        otp_code: otp,
        new_password: newPassword,
      });
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const stepLabels = ["Enter Email", "Verify OTP", "New Password"];

  return (
    <main className="auth-shell">
      <section className="auth-card glass-panel">
        <Link className="brand-mark auth-brand" to="/">
          <span className="brand-icon">NG</span>
          <span>NoctraGrid Relay</span>
        </Link>

        {/* Step indicator */}
        <div className="otp-steps">
          {stepLabels.map((label, i) => (
            <div
              key={label}
              className={`otp-step ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""}`}
            >
              <span className="otp-step-num">{step > i + 1 ? "✓" : i + 1}</span>
              <span className="otp-step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — Email */}
        {step === 1 && (
          <>
            <span className="eyebrow">Account recovery</span>
            <h1>Reset your password</h1>
            <p className="auth-intro">
              Enter the email address associated with your account. We'll send you a verification code to reset your password.
            </p>
            <form onSubmit={handleRequestOTP} autoComplete="off">
              <label>
                Email Address
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {error && <p className="form-status error">{error}</p>}
              {success && <p className="form-status success">{success}</p>}
              <button className="primary-button full" disabled={loading}>
                {loading ? "Sending code..." : "Send Verification Code"}
              </button>
            </form>
          </>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <>
            <span className="eyebrow">Check your inbox</span>
            <h1>Enter verification code</h1>
            <p className="auth-intro">
              A 6-digit code was sent to <strong>{email}</strong>. It expires in 15 minutes.
            </p>
            <form onSubmit={handleVerifyOTP} autoComplete="off">
              <label>
                Verification Code
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="otp-input"
                />
              </label>
              {error && <p className="form-status error">{error}</p>}
              {success && <p className="form-status success">{success}</p>}
              
              <div className="otp-resend-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Didn't receive the code?</span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleResendOTP}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendTimer > 0 ? "var(--muted)" : "var(--green)",
                    fontWeight: 700,
                    cursor: resendTimer > 0 ? "default" : "pointer",
                    fontSize: "13px",
                    padding: 0
                  }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </button>
              </div>

              <button className="primary-button full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                type="button"
                className="ghost-button full"
                style={{ marginTop: "8px" }}
                onClick={() => { setStep(1); setError(""); setOtp(""); setSuccess(""); }}
              >
                ← Change email
              </button>
            </form>
          </>
        )}

        {/* Step 3 — New password */}
        {step === 3 && (
          <>
            <span className="eyebrow">Almost done</span>
            <h1>Set a new password</h1>
            <p className="auth-intro">
              Choose a strong password. It must be at least 6 characters.
            </p>
            <form onSubmit={handleResetPassword} autoComplete="new-password">
              <label>
                New Password
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label>
                Confirm Password
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              {error && <p className="form-status error">{error}</p>}
              {success && <p className="form-status success">{success} Redirecting to login...</p>}
              <button className="primary-button full" disabled={loading || !!success}>
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch">
          Remembered it? <Link to="/login">Back to Login</Link>
        </p>
      </section>
    </main>
  );
}
