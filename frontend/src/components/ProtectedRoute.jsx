import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="screen-loader">
        <div className="loader-orb" />
        <p>Loading NoctraGrid relay...</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin)
    return (
      <section className="access-denied glass-panel">
        <span className="eyebrow">403 Forbidden</span>
        <h1>Access denied</h1>
        <p>
          Admin access required. This page contains private visitor, lead, user,
          and platform analytics.
        </p>
      </section>
    );
  return children;
}
