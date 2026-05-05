import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ComplaintCard from '../components/ComplaintCard';
import EmptyState from '../components/EmptyState';
import StatsGrid from '../components/StatsGrid';
import { 
  EyeOff, AlertTriangle, CheckCircle, Shield, 
  BarChart3, TrendingUp, Users, Clock, ClipboardList
} from 'lucide-react';
import { API_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

export default function AuthorityDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('my_queue'); // 'my_queue' | 'all' | 'personal' | 'escalated' | 'breached'
  const [selectedDept, setSelectedDept] = useState('all');
  const { user } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join-user', user.id);
    if (user.departmentId) socket.emit('join-dept', user.departmentId);

    socket.on('ticket-updated', () => fetchAll());
    socket.on('new-ticket', () => fetchAll());

    return () => {
      socket.off('ticket-updated');
      socket.off('new-ticket');
    };
  }, [socket, user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints/all`);
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status, resolutionProof) => {
    try {
      await axios.put(`${API_URL}/complaints/${id}/status`, { status, resolutionProof });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Performance Analytics calculation
  const analytics = useMemo(() => {
    const total = complaints.length;
    const breached = complaints.filter(c => c.slaBreached).length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const escalated = complaints.filter(c => c.status === 'ESCALATED').length;
    
    // SLA Compliance %
    const slaCompliance = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;
    
    // Group by department
    const depts = {};
    complaints.forEach(c => {
      const dName = c.department?.name || 'Unassigned';
      if (!depts[dName]) depts[dName] = { total: 0, resolved: 0, breached: 0 };
      depts[dName].total++;
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') depts[dName].resolved++;
      if (c.slaBreached) depts[dName].breached++;
    });

    return { total, breached, resolved, escalated, slaCompliance, depts };
  }, [complaints]);

  const stats = [
    { value: analytics.total, label: 'All Tickets', icon: <BarChart3 size={22} color="var(--accent-blue)" />, bg: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' },
    { value: `${analytics.slaCompliance}%`, label: 'SLA Compliance', icon: <TrendingUp size={22} color="var(--success)" />, bg: 'rgba(16,185,129,0.12)', color: 'var(--success)' },
    { value: analytics.breached, label: 'SLA Breaches', icon: <AlertTriangle size={22} color="var(--danger)" />, bg: 'rgba(239,68,68,0.12)', color: 'var(--danger)' },
    { value: analytics.escalated, label: 'Escalated Cases', icon: <Shield size={22} color="var(--accent-violet)" />, bg: 'rgba(139,92,246,0.12)', color: 'var(--accent-violet)' },
  ];

  let filtered = [...complaints];
  if (filter === 'my_queue') filtered = filtered.filter(c => c.assignedToId === user?.id && c.status !== 'CLOSED');
  if (filter === 'personal') filtered = filtered.filter(c => c.visibility === 'PERSONAL');
  if (filter === 'escalated') filtered = filtered.filter(c => c.status === 'ESCALATED');
  if (filter === 'breached') filtered = filtered.filter(c => c.slaBreached);
  if (selectedDept !== 'all') filtered = filtered.filter(c => c.department?.name === selectedDept);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)'
          }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1>Institutional Oversight</h1>
            <p>Performance analytics and department-wide grievance auditing.</p>
          </div>
        </div>
      </div>

      <StatsGrid stats={stats} />

      {/* Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--accent-blue)" /> Department Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(analytics.depts).map(([name, data]) => {
              const compliance = Math.round(((data.total - data.breached) / data.total) * 100);
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{name}</span>
                    <span style={{ color: compliance < 70 ? 'var(--danger)' : 'var(--success)' }}>{compliance}% Compliance</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${compliance}%`, height: '100%', background: compliance < 70 ? 'var(--danger)' : 'var(--success)', transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--warning)" /> SLA Health Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'rgba(16,185,129,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{analytics.resolved}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Successful Resolutions</div>
             </div>
             <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'rgba(239,68,68,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{analytics.breached}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Violations</div>
             </div>
          </div>
          <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            SLA compliance tracks the percentage of tickets resolved within the university's standard response time guidelines.
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px', 
        padding: '0 4px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'my_queue', label: 'My Queue', icon: <ClipboardList size={14} /> },
            { key: 'all', label: 'All Cases', icon: <BarChart3 size={14} /> },
            { key: 'personal', label: '🔒 Personal', icon: null },
            { key: 'escalated', label: '⚠ Escalated', icon: null },
            { key: 'breached', label: '🔴 SLA Breached', icon: null },
          ].map(f => (
            <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f.key)}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
        
        <select 
          className="input-field" 
          style={{ width: '200px', padding: '8px', fontSize: '0.8rem' }}
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="all">All Departments</option>
          {Object.keys(analytics.depts).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="complaints-list">
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: '100px' }}>
              <div className="skeleton" style={{ width: '50%', height: '14px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '80%', height: '12px' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try adjusting your filters or department selection." icon={Users} />
      ) : (
        <div className="complaints-list">
          {filtered.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              showActions
              onStatusChange={handleStatusChange}
              userRole="AUTHORITY"
            />
          ))}
        </div>
      )}
    </div>
  );
}
