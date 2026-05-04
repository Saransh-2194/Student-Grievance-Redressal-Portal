import { useState, useEffect } from 'react';
import axios from 'axios';
import EmptyState from '../components/EmptyState';
import { ScrollText, ArrowRight } from 'lucide-react';

import { API_URL } from '../lib/api';

const formatDateTime = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints/audit-log`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'rgba(6,182,212,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <ScrollText size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h1>Audit Log</h1>
            <p>Immutable record of all status changes and escalation events</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="complaints-list">
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ height: '60px' }}>
              <div className="skeleton" style={{ width: '70%', height: '14px' }} />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs" description="No status changes or escalations have been recorded yet." icon={ScrollText} />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complaint</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Change</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hash</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 20px', fontWeight: 500 }}>
                    {log.complaint?.title || 'Unknown'}
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                    {log.complaint?.category || '—'}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge badge-${log.oldStatus.toLowerCase()}`}>{log.oldStatus}</span>
                      <ArrowRight size={14} color="var(--text-muted)" />
                      <span className={`badge badge-${log.newStatus.toLowerCase()}`}>{log.newStatus}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {log.complaint?.hashId ? log.complaint.hashId.substring(0, 12) + '…' : '—'}
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {formatDateTime(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
