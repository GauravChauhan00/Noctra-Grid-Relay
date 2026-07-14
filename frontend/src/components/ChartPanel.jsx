export default function ChartPanel({
  title,
  subtitle,
  children,
  empty = false,
}) {
  return (
    <section className="chart-panel glass-panel">
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {empty ? (
        <div className="empty-chart">
          No chart data yet. Generate a report first.
        </div>
      ) : (
        children
      )}
    </section>
  );
}
