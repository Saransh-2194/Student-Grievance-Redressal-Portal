export default function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map((s, i) => (
        <div key={i} className="glass-panel" style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: s.bg || 'rgba(59,130,246,0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: s.color || 'var(--accent-blue)'
          }}>
            {s.icon}
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
