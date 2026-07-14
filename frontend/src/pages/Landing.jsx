import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  FileSpreadsheet, 
  FileBarChart, 
  Mail, 
  Shield, 
  UploadCloud, 
  Sparkles 
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar.jsx";
import { getErrorMessage, getSessionId } from "../utils/helpers.js";

const features = [
  {
    icon: <FileSpreadsheet size={20} />,
    title: "Smart Excel Cleaning",
    text: "Remove duplicates, fill blanks, trim spaces, standardize columns, and detect dates/numbers automatically.",
  },
  {
    icon: <FileBarChart size={20} />,
    title: "Premium Reports",
    text: "Generate detailed analytics, PDF summaries, category breakdowns, insights, and clean Excel/CSV downloads.",
  },
  {
    icon: <Mail size={20} />,
    title: "Gmail App Password Relay",
    text: "Attach and send generated PDFs using your own Gmail SMTP app password. No paid email API required.",
  },
  {
    icon: <Shield size={20} />,
    title: "Secure Workspace",
    text: "Review files, visitor metrics, generated reports, and secure SMTP mail logs directly from your private workspace.",
  },
];

export default function Landing() {
  const [lead, setLead] = useState({
    name: "",
    email: "",
    company_role: "",
    message: "",
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .post("/api/analytics/visit", {
        page: "Landing Page",
        anonymous_session_id: getSessionId(),
        user_agent: navigator.userAgent,
      })
      .catch(() => {});
  }, []);

  async function handleLeadSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await api.post("/api/analytics/lead", lead);
      setLead({ name: "", email: "", company_role: "", message: "" });
      setStatus({
        type: "success",
        text: "Message submitted. It is saved in Admin Analytics and emailed to the owner when Gmail SMTP + OWNER_ALERT_EMAIL are configured.",
      });
    } catch (error) {
      setStatus({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing-page">
      <div className="ambient-orb orb-one" />
      <div className="ambient-orb orb-two" />
      <Navbar />

      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">⚡ NoctraGrid Relay · SMTP-powered spreadsheet intelligence</span>
          <h1>Obsidian-grade spreadsheet intelligence that cleans, reports, and delivers itself.</h1>
          <p>
            Upload Excel or CSV files, clean messy data, generate professional PDFs, and auto-deliver them with your own Google App Password SMTP relay.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/signup">
              Launch Relay Workspace
            </Link>
            <Link className="secondary-button" to="/login?role=admin">
              Admin Login
            </Link>
          </div>
          <div className="trust-row">
            <span>⚙ FastAPI</span>
            <span>🧾 PDF reports</span>
            <span>🔐 Fully Secure</span>
            <span>🚀Accurate Data</span>
          </div>
        </div>

        <div className="hero-preview glass-panel floating-card">
          <div className="preview-topbar">
            <span />
            <span />
            <span />
            <p>Relay console</p>
          </div>
          <div className="preview-grid">
            <article>
              <small>Rows cleaned</small>
              <strong>12.8k</strong>
              <span>+98% quality</span>
            </article>
            <article>
              <small>Reports</small>
              <strong>42</strong>
              <span>saved</span>
            </article>
            <article>
              <small>Email jobs</small>
              <strong>31</strong>
              <span>Gmail SMTP</span>
            </article>
          </div>
          <div className="mock-chart">
            <i style={{ height: "42%" }} />
            <i style={{ height: "68%" }} />
            <i style={{ height: "55%" }} />
            <i style={{ height: "82%" }} />
            <i style={{ height: "62%" }} />
            <i style={{ height: "92%" }} />
          </div>
          <div className="pipeline-card">
            <b>Upload</b>
            <span />
            <b>Clean</b>
            <span />
            <b>Report</b>
            <span />
            <b>Email</b>
            <span />
            <b>Admin</b>
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-section">
        <span className="eyebrow center">How it works</span>
        <h2>A complete upload-to-inbox pipeline with a hacker-clean control surface.</h2>
        <div className="workflow-line">
          {[
            [<UploadCloud size={20} />, "Upload Excel"],
            [<Sparkles size={20} />, "Clean Data"],
            [<FileBarChart size={20} />, "Generate Report"],
            [<Mail size={20} />, "Email Report"],
            [<Shield size={20} />, "Admin Analytics"],
          ].map(([icon, step], index) => (
            <div className="workflow-node" key={step}>
              <span>{icon}</span>
              <strong>{step}</strong>
              <small>Step {index + 1}</small>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section feature-section">
        <span className="eyebrow center">Product features</span>
        <h2>Premium hacker UI backed by real automation, real files, and real SMTP delivery.</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card glass-panel">
              <div className="feature-dot">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section dashboard-preview-section">
        <div>
          <span className="eyebrow">Dashboard preview</span>
          <h2>Separate user workspace and private owner controls.</h2>
          <p>
            Users can upload, clean, auto-email PDFs, download outputs, and delete their own reports. Admin gets protected analytics, user/report management, leads, visits, SMTP status, and activity logs.
          </p>
        </div>
        <div className="dashboard-mock glass-panel">
          <div className="mock-sidebar" />
          <div className="mock-content">
            <div className="mock-stats">
              <span />
              <span />
              <span />
            </div>
            <div className="mock-wide" />
            <div className="mock-table">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="landing-section contact-section">
        <div className="contact-copy">
          <span className="eyebrow">Demo interest</span>
          <h2>Want a walkthrough or want to review the project?</h2>
          <p>
            Submit the form. The lead is stored in the database and visible in Admin Analytics. When OWNER_ALERT_EMAIL is configured, the same message is delivered to the owner inbox through Gmail SMTP.
          </p>
          <div className="privacy-note">
            🔒 Only basic anonymous page visits and form details are stored for this demo.
          </div>
        </div>
        <form className="lead-form glass-panel" onSubmit={handleLeadSubmit}>
          <label>
            Name
            <input
              required
              value={lead.name}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
            />
          </label>
          <label>
            Company/Role optional
            <input
              value={lead.company_role}
              onChange={(e) =>
                setLead({ ...lead, company_role: e.target.value })
              }
            />
          </label>
          <label>
            Message
            <textarea
              required
              rows="4"
              value={lead.message}
              onChange={(e) => setLead({ ...lead, message: e.target.value })}
            />
          </label>
          {status && (
            <p className={`form-status ${status.type}`}>{status.text}</p>
          )}
          <button className="primary-button full" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Interest"}
          </button>
        </form>
      </section>

      <footer className="landing-footer">
        <strong>NoctraGrid Relay</strong>
        <span>
          Developer: Gaurav (gaurav949855@gmail.com)
        </span>
      </footer>
    </div>
  );
}
