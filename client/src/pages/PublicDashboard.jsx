import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import StatsGrid from '../components/StatsGrid';
import EmptyState from '../components/EmptyState';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';

import { API_URL } from '../lib/api';
import { useSocket } from '../hooks/useSocket';

export default function PublicDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, trending, escalated

  useEffect(() => {
    fetchComplaints();
    
    if (socket) {
      socket.on('ticket-updated', () => fetchComplaints());
      socket.on('ticket-deleted', () => fetchComplaints());
    }

    const handleRefresh = () => fetchComplaints();
    window.addEventListener('ticket-refresh', handleRefresh);

    return () => {
      if (socket) {
        socket.off('ticket-updated');
        socket.off('ticket-deleted');
      }
      window.removeEventListener('ticket-refresh', handleRefresh);
    };
  }, [socket]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints/public`);
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, type) => {
    try {
      await axios.post(`${API_URL}/complaints/${id}/vote`, { type });
      fetchComplaints();
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  // Computed stats
  const total = complaints.length;
  const escalated = complaints.filter(c => c.status === 'ESCALATED').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  const pending = complaints.filter(c => ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(c.status)).length;
  const avgScore = total ? Math.round(complaints.reduce((sum, c) => sum + (c.impactScore || 0), 0) / total) : 0;

  // Filtered list
  let filtered = [...complaints];
  if (filter === 'trending') {
    filtered = filtered.filter(c => c.impactScore > 0).sort((a, b) => b.impactScore - a.impactScore);
  } else if (filter === 'escalated') {
    filtered = filtered.filter(c => c.status === 'ESCALATED');
  }
  if (filter === 'pending') filtered = filtered.filter(c => !['RESOLVED', 'CLOSED'].includes(c.status));
  if (filter === 'resolved') filtered = filtered.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status));

  if (query) {
    filtered = filtered.filter(c => 
      c.title.toLowerCase().includes(query) || 
      c.category.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    );
  }

  const stats = [
    { value: total, label: 'Total Complaints', icon: <BarChart3 size={22} color="var(--accent-blue)" />, bg: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' },
    { value: escalated, label: 'Escalated', icon: <AlertTriangle size={22} color="var(--accent-violet)" />, bg: 'rgba(139,92,246,0.12)', color: 'var(--accent-violet)' },
    { value: resolved, label: 'Resolved', icon: <CheckCircle size={22} color="var(--success)" />, bg: 'rgba(16,185,129,0.12)', color: 'var(--success)' },
    { value: pending, label: 'Pending', icon: <Clock size={22} color="var(--warning)" />, bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>University Dashboard</h1>
        <p>Public complaints sorted by community impact</p>
      </div>

      <StatsGrid stats={stats} />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'trending', label: '🔥 Trending' },
          { key: 'escalated', label: '⚠ Escalated' },
        ].map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="complaints-list">
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: '120px' }}>
              <div className="skeleton" style={{ width: '60%', height: '18px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '40%', height: '14px' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No complaints found" description="There are no public complaints matching this filter." />
      ) : (
        <div className="complaints-list">
          {filtered.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onVote={user?.role === 'STUDENT' ? handleVote : null}
              userRole={user?.role}
            />
          ))}
        </div>
      )}
    </div>
  );
}
