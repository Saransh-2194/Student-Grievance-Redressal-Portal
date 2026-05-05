import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ComplaintCard from '../components/ComplaintCard';
import EmptyState from '../components/EmptyState';
import StatsGrid from '../components/StatsGrid';
import { 
  ClipboardList, Clock, CheckCircle, AlertTriangle, 
  Users, ShieldAlert, Filter, ArrowUpDown 
} from 'lucide-react';
import { API_URL } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('my_queue'); // 'my_queue' | 'unassigned' | 'escalated' | 'archive'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sla'); // 'sla' | 'newest' | 'impact'

  const socket = useSocket(null, user?.departmentId);

  useEffect(() => {
    fetchDept();
  }, []);

  useEffect(() => {
    if (!socket || !user?.departmentId) return;

    const deptRoom = `dept-${user.departmentId}`;
    console.log(`[Dashboard] Subscribing to room: ${deptRoom}`);

    socket.on('new-ticket', (ticket) => {
      setComplaints(prev => [ticket, ...prev]);
      addToast(`New ticket: ${ticket.title}`, "INFO");
    });

    socket.on('ticket-updated', (data) => {
      console.log('[Dashboard] Real-time refresh triggered:', data);
      fetchDept();
    });

    return () => {
      socket.off('new-ticket');
      socket.off('ticket-updated');
    };
  }, [socket, user?.departmentId, addToast]);

  const fetchDept = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints/department`);
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueRefresh = () => {
    fetchDept();
    addToast("Queue refreshed", "INFO");
  };

  // Stats calculation
  const stats = useMemo(() => {
    const unassigned = complaints.filter(c => !c.assignedTo).length;
    const breached = complaints.filter(c => c.slaBreached).length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    
    return [
      { value: unassigned, label: 'Unassigned', icon: <Users size={22} color="var(--warning)" />, bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)' },
      { value: breached, label: 'SLA Breached', icon: <ShieldAlert size={22} color="var(--danger)" />, bg: 'rgba(239,68,68,0.12)', color: 'var(--danger)' },
      { value: resolved, label: 'Resolved', icon: <CheckCircle size={22} color="var(--success)" />, bg: 'rgba(16,185,129,0.12)', color: 'var(--success)' },
      { value: complaints.length, label: 'Total Backlog', icon: <ClipboardList size={22} color="var(--accent-blue)" />, bg: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' },
    ];
  }, [complaints]);

  // Filtering & Sorting Logic
  const filteredComplaints = useMemo(() => {
    let list = [...complaints];

    // 1. View Filter
    if (view === 'my_queue') list = list.filter(c => c.assignedToId === user?.id && c.status !== 'CLOSED');
    if (view === 'unassigned') list = list.filter(c => !c.assignedTo);
    if (view === 'escalated') list = list.filter(c => c.status === 'ESCALATED');
    // 'archive' shows everything (no filter)

    // 2. Severity Filter
    if (severityFilter !== 'all') list = list.filter(c => c.severity === severityFilter);

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === 'sla') {
        return new Date(a.slaDeadline || 0) - new Date(b.slaDeadline || 0);
      }
      if (sortBy === 'impact') {
        return (b.impactScore || 0) - (a.impactScore || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [complaints, view, severityFilter, sortBy]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Status wise Summary */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'none' }}>Status wise Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div className="glass-panel" style={{ 
            padding: '20px 24px', 
            background: 'rgba(255, 192, 203, 0.2)', 
            border: 'none', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#d63384' }}>Open</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d63384' }}>{complaints.filter(c => c.status === 'CREATED').length}</span>
          </div>

          <div className="glass-panel" style={{ 
            padding: '20px 24px', 
            background: 'rgba(139, 92, 246, 0.1)', 
            border: 'none', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-violet)' }}>In progress</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-violet)' }}>{complaints.filter(c => c.status === 'IN_PROGRESS').length}</span>
          </div>

          <div className="glass-panel" style={{ 
            padding: '20px 24px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: 'none', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)' }}>Resolved</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length}</span>
          </div>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-secondary)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Jira-style Toolbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px', 
        background: 'var(--surface)', 
        padding: '12px 20px', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'my_queue', label: 'My Queue' },
            { key: 'unassigned', label: 'Unassigned' },
            { key: 'escalated', label: 'Escalated' },
            { key: 'archive', label: 'Department Backlog' },
          ].map(v => (
            <button 
              key={v.key} 
              className={`btn btn-sm ${view === v.key ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select 
              className="input-field" 
              style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Priority</option>
            </select>
          </div>

          <select 
            className="input-field" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="sla">Sort by SLA Risk</option>
            <option value="impact">Sort by Impact</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="complaints-list">
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: '100px' }}>
              <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '70%', height: '12px' }} />
            </div>
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <EmptyState 
          title="Queue Clear" 
          description={`No tickets found in the "${view.replace('_', ' ')}" queue.`} 
          icon={CheckCircle} 
        />
      ) : (
        <div className="complaints-list">
          {filteredComplaints.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              showActions
              userRole="ADMIN"
            />
          ))}
        </div>
      )}
    </div>
  );
}
