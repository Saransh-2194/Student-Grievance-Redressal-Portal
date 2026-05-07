import { useState, useEffect } from 'react';
import axios from 'axios';
import ComplaintCard from '../components/ComplaintCard';
import EmptyState from '../components/EmptyState';
import { AlertTriangle } from 'lucide-react';

import { API_URL } from '../lib/api';

export default function EscalatedView() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEscalated();
  }, []);

  const fetchEscalated = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints/escalated`);
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
      fetchEscalated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'rgba(139,92,246,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={18} color="var(--accent-violet)" />
          </div>
          <div>
            <h1>Escalated Complaints</h1>
            <p>Complaints that breached SLA deadlines or exceeded the impact threshold</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="complaints-list">
          {[1,2].map(i => (
            <div key={i} className="card" style={{ height: '120px' }}>
              <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '80%', height: '14px' }} />
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState title="No escalated complaints" description="All complaints are being handled within their SLA deadlines." icon={AlertTriangle} />
      ) : (
        <div className="complaints-list">
          {complaints.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              showActions
              onStatusChange={handleStatusChange}
              userRole="SUPER_ADMIN"
            />
          ))}
        </div>
      )}
    </div>
  );
}
