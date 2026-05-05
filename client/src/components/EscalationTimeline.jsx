import { CheckCircle2, Circle, Clock } from 'lucide-react';

export default function EscalationTimeline({ chain = [], currentIndex = 0, logs = [] }) {
  if (!chain || chain.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No hierarchy information available for this ticket.
      </div>
    );
  }

  return (
    <div className="escalation-timeline" style={{ padding: '20px' }}>
      <h4 style={{ marginBottom: '20px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        Authority Resolution Path
      </h4>
      
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* The vertical line */}
        <div style={{ 
          position: 'absolute', 
          left: '11px', 
          top: '10px', 
          bottom: '10px', 
          width: '2px', 
          background: 'var(--border-color)',
          zIndex: 0
        }} />

        {chain.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          
          // Find log entry for this step if it exists (for past steps)
          const log = logs.find(l => l.toIndex === index);

          return (
            <div key={index} style={{ 
              display: 'flex', 
              gap: '16px', 
              position: 'relative', 
              zIndex: 1,
              opacity: isFuture ? 0.6 : 1
            }}>
              {/* Icon / Node */}
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: isCurrent ? 'var(--accent-blue)' : (isPast ? 'var(--success)' : 'var(--surface)'),
                border: `2px solid ${isCurrent ? 'var(--accent-blue)' : (isPast ? 'var(--success)' : 'var(--border-color)')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: isCurrent || isPast ? 'white' : 'var(--text-muted)',
                boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
              }}>
                {isPast ? <CheckCircle2 size={14} /> : (isCurrent ? <Clock size={14} /> : <Circle size={10} />)}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: isCurrent ? 700 : 600, 
                      color: isCurrent ? 'var(--accent-blue)' : 'var(--text-primary)' 
                    }}>
                      {step.designation}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {step.email}
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: 'var(--accent-blue)', 
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      Current Authority
                    </span>
                  )}
                </div>

                {log && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: 'var(--surface-hover)', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    borderLeft: '2px solid var(--success)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      Escalated {log.reason === 'SLA_BREACH' ? 'automatically (SLA Breach)' : 'manually'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
