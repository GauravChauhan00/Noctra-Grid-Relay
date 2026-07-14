import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <main className="auth-shell">
      <section className="auth-card glass-panel">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <p>This NoctraGrid route does not exist in the relay map.</p>
        <Link className="primary-button full" to="/">
          Go Home
        </Link>
      </section>
    </main>
  );
}
