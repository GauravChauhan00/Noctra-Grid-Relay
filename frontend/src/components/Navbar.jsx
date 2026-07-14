import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <nav className="landing-nav">
      <Link to="/" className="brand-mark">
        <span className="brand-icon">NG</span>
        <span>NoctraGrid Relay</span>
      </Link>
      <div className="landing-nav-links nav-glass-tray">
        <a href="#workflow">Workflow</a>
        <a href="#features">Features</a>
        <a href="#contact">Contact</a>
        {user ? (
          <Link className="nav-cta" to="/dashboard">
            Open Console
          </Link>
        ) : (
          <>
            <Link to="/login">User Login</Link>
            <Link to="/login?role=admin">Admin Login</Link>
            <Link className="nav-cta" to="/signup">
              Start Relay
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
