import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  FileBarChart,
  Mail,
  Shield,
  UploadCloud,
  Filter,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar.jsx";
import { getErrorMessage, getSessionId } from "../utils/helpers.js";

const features = [
  {
    icon: <FileSpreadsheet size={20} />,
    title: "Intelligent Data Cleaning",
    text: "Automatically detects and corrects data quality issues — removes duplicates, fills gaps, and standardizes formats so your data is always analysis-ready.",
  },
  {
    icon: <FileBarChart size={20} />,
    title: "Automated Report Generation",
    text: "Turns your raw uploads into polished, structured PDF reports with visual summaries, breakdowns, and downloadable outputs — in seconds.",
  },
  {
    icon: <Mail size={20} />,
    title: "Instant Email Delivery",
    text: "Reports are automatically delivered to the right inbox as soon as they're ready. No manual downloads or forwarding required.",
  },
  {
    icon: <Shield size={20} />,
    title: "Full Admin Visibility",
    text: "A dedicated admin panel gives complete oversight — monitor usage, manage users, track report history, and review activity across the platform.",
  },
];

const year = new Date().getFullYear();

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
        text: "Thank you! We've received your message and will get back to you shortly.",
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

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">NoctraGrid Relay · Intelligent Data Processing</span>
          <h1>Upload your data. Get clean reports delivered automatically.</h1>
          <p>
            NoctraGrid Relay handles everything — from messy spreadsheets to
            polished, professional reports sent directly to your inbox. Simple,
            fast, and completely automated.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/signup">
              Get Started Free
            </Link>
            <Link className="secondary-button" to="/login">
              Sign In
            </Link>
          </div>
          <div className="trust-row">
            <span>No setup required</span>
            <span>Automated reports</span>
            <span>Instant delivery</span>
            <span>Role-based access</span>
          </div>
        </div>

        <div className="hero-preview glass-panel floating-card">
          <div className="preview-topbar">
            <span />
            <span />
            <span />
            <p>Dashboard</p>
          </div>
          <div className="preview-grid">
            <article>
              <small>Records processed</small>
              <strong>12.8k</strong>
              <span>+98% accuracy</span>
            </article>
            <article>
              <small>Reports</small>
              <strong>42</strong>
              <span>generated</span>
            </article>
            <article>
              <small>Delivered</small>
              <strong>31</strong>
              <span>on time</span>
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
            <b>Deliver</b>
            <span />
            <b>Review</b>
          </div>
        </div>
      </section>

      {/* ── Workflow ─────────────────────────────────── */}
      <section id="workflow" className="landing-section">
        <span className="eyebrow center">How It Works</span>
        <h2>From raw data to ready-to-share reports in minutes.</h2>
        <div className="workflow-line">
          {[
            [<UploadCloud size={18} />, "Upload File", "Drop any spreadsheet"],
            [<Filter size={18} />, "Auto Clean", "Errors fixed instantly"],
            [<FileBarChart size={18} />, "Build Report", "Structured PDF output"],
            [<Mail size={18} />, "Deliver", "Sent to your inbox"],
            [<Shield size={18} />, "Admin Review", "Full visibility & control"],
          ].map(([icon, step, desc], index) => (
            <div className="workflow-node" key={step}>
              <span>{icon}</span>
              <div className="workflow-text">
                <strong>{step}</strong>
                <small>{desc}</small>
              </div>
              <em>0{index + 1}</em>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="landing-section feature-section">
        <span className="eyebrow center">Core Capabilities</span>
        <h2>Everything your team needs. Nothing you don't.</h2>
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

      {/* ── Dashboard preview ─────────────────────────── */}
      <section className="landing-section dashboard-preview-section">
        <div>
          <span className="eyebrow">Platform</span>
          <h2>A workspace built for clarity and control.</h2>
          <p>
            Each user gets a personal workspace to upload, process, and track
            their reports. Admins get a powerful overview — managing users,
            reviewing activity, and ensuring everything runs smoothly across
            the platform.
          </p>
        </div>
        <div className="dashboard-mock">
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

      {/* ── Contact ───────────────────────────────────── */}
      <section id="contact" className="landing-section contact-section">
        <div className="contact-copy">
          <span className="eyebrow">Get In Touch</span>
          <h2>Have a question? We'd love to hear from you.</h2>
          <p>
            Whether you're evaluating the platform, need a walkthrough, or
            want to discuss a specific use case — reach out and we'll respond
            promptly.
          </p>
          <div className="privacy-note">
            Your information is kept private and used only to respond to your inquiry.
          </div>
        </div>
        <form className="lead-form glass-panel" onSubmit={handleLeadSubmit}>
          <label>
            Full Name
            <input
              required
              placeholder="Your name"
              value={lead.name}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
            />
          </label>
          <label>
            Email Address
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
            />
          </label>
          <label>
            Company / Role <span className="field-optional">(optional)</span>
            <input
              placeholder="e.g. Data Analyst at Acme Corp"
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
              placeholder="Tell us what you're looking for..."
              value={lead.message}
              onChange={(e) => setLead({ ...lead, message: e.target.value })}
            />
          </label>
          {status && (
            <p className={`form-status ${status.type}`}>{status.text}</p>
          )}
          <button className="primary-button full" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>

      <footer className="landing-footer">
        <span>© {year} NoctraGrid Relay. All rights reserved.</span>
        <strong> Developer Contact: Gaurav94855@gmail.com</strong>
      </footer>
    </div>
  );
}
