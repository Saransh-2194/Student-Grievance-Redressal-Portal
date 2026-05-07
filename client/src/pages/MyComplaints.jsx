import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ComplaintCard from '../components/ComplaintCard';
import EmptyState from '../components/EmptyState';
import StatsGrid from '../components/StatsGrid';
import { FileText, Eye, EyeOff, CheckCircle, Clock } from 'lucide-react';
import { API_URL } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

export default function MyComplaints() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const socket = useSocket(null, null, user?.id);

  useEffect(() => {
    fetchMy();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;
    
    // Refresh list when notifications arrive or status updates
    socket.on(`notification-${user.id}`, () => fetchMy());
    socket.on('ticket-updated', () => fetchMy());
    socket.on('ticket-deleted', () => fetchMy());

    const handleRefresh = () => fetchMy();
    window.addEventListener('ticket-refresh', handleRefresh);

    return () => {
      socket.off(`notification-${user.id}`);
      socket.off('ticket-updated');
      socket.off('ticket-deleted');
      window.removeEventListener('ticket-refresh', handleRefresh);
    };
  }, [socket, user]);

  const fetchMy = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints/mine`);
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${API_URL}/complaints/${id}/status`, { status });
      fetchMy();
      addToast(`Status updated to ${status}`, "SUCCESS");
    } catch (err) {
      addToast(err.response?.data?.error || "Status update failed", "DANGER");
    }
  };

  const stats = useMemo(() => {
    const publicCount = complaints.filter(c => c.visibility === 'PUBLIC').length;
    const personalCount = complaints.filter(c => c.visibility === 'PERSONAL').length;
    const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const activeCount = complaints.filter(c => !['RESOLVED', 'CLOSED'].includes(c.status)).length;

    return [
      { value: complaints.length, label: 'Total Submitted', icon: <FileText size={22} color="var(--accent-blue)" />, bg: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' },
      { value: activeCount, label: 'Active Tickets', icon: <Clock size={22} color="var(--warning)" />, bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)' },
      { value: resolvedCount, label: 'Resolved', icon: <CheckCircle size={22} color="var(--success)" />, bg: 'rgba(16,185,129,0.12)', color: 'var(--success)' },
      { value: personalCount, label: 'Personal (🔒)', icon: <EyeOff size={22} color="var(--accent-violet)" />, bg: 'rgba(139,92,246,0.12)', color: 'var(--accent-violet)' },
    ];
  }, [complaints]);

  const filtered = useMemo(() => {
    let list = [...complaints];
    if (filter === 'public') list = list.filter(c => c.visibility === 'PUBLIC');
    if (filter === 'personal') list = list.filter(c => c.visibility === 'PERSONAL');
    if (filter === 'pending') list = list.filter(c => !['RESOLVED', 'CLOSED'].includes(c.status));
    if (filter === 'resolved_pending') list = list.filter(c => c.status === 'RESOLVED');
    if (filter === 'archive') list = list.filter(c => c.status === 'CLOSED');

    if (query) {
      list = list.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.category.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    return list;
  }, [complaints, filter, query]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>My Tickets</h1>
        <p>Track your grievances through their enterprise lifecycle.</p>
      </div>

      <StatsGrid stats={stats} />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: 'Active' },
          { key: 'resolved_pending', label: 'Resolved (Pending Action)' },
          { key: 'archive', label: 'Archive (Closed)' },
          { key: 'all', label: 'Full History' },
        ].map(f => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="complaints-list">
          {[1,2].map(i => (
            <div key={i} className="card" style={{ height: '100px' }}>
              <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '80%', height: '14px' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No tickets" description="You haven't submitted any tickets matching this filter." icon={FileText} />
      ) : (
        <div className="complaints-list">
          {filtered.map(c => (
            <ComplaintCard 
              key={c.id} 
              complaint={c} 
              userRole="STUDENT"
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
