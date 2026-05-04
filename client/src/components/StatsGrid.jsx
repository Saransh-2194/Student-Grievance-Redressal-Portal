export default function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map((s, i) => (
        <div key={i} className="stat-card">
          <div className="stat-icon" style={{ background: s.bg || 'rgba(59,130,246,0.15)' }}>
            {s.icon}
          </div>
          <div>
            <div className="stat-value" style={{ color: s.color || 'var(--text-primary)' }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
