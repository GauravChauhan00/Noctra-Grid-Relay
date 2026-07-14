export default function StatCard({ label, value, hint, accent = "blue" }) {
  return (
    <article className={`stat-card ${accent}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {hint && <span>{hint}</span>}
    </article>
  );
}
