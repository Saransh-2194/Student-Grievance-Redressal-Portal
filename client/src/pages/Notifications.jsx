import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      addToast("All notifications marked as read", "SUCCESS");
    } catch (err) {
      addToast("Failed to mark all as read", "DANGER");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 size={20} color="var(--success)" />;
      case 'WARNING': return <AlertTriangle size={20} color="var(--warning)" />;
      case 'DANGER': return <AlertTriangle size={20} color="var(--danger)" />;
      default: return <Info size={20} color="var(--accent-blue)" />;
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)' }}>Stay updated with your grievance lifecycle.</p>
        </div>
        <button className="btn btn-secondary" onClick={markAllAsRead}>Mark all as read</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading updates...</div>
        ) : notifications.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
            <Bell size={48} color="var(--text-muted)" style={{ marginBottom: '20px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>Your inbox is empty.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', background: n.read ? 'var(--bg-secondary)' : 'rgba(0,97,255,0.02)', borderLeft: n.read ? '1px solid var(--border-color)' : '4px solid var(--accent-blue)' }}>
              <div style={{ marginTop: '4px' }}>{getIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)' }}>{n.message}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Clock size={14} /> {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
