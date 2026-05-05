import { useState, useEffect } from 'react';
import { X, Search, User, ShieldCheck, Mail } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../lib/api';

export default function AssignModal({ isOpen, onClose, onAssign, currentAssigneeId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEligibleUsers();
    }
  }, [isOpen]);

  const fetchEligibleUsers = async () => {
    setLoading(true);
    try {
      // In a real app, this might be filtered by department or role
      // For now, we'll fetch ADMIN and AUTHORITY users
      const res = await axios.get(`${API_URL}/auth/staff`); 
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.designation && u.designation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ width: '450px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Assign Authority</h3>
          <button className="btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Search by name or designation..." 
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading staff...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No staff members found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredUsers.map(u => (
                  <button 
                    key={u.id}
                    className="btn-ghost"
                    style={{ 
                      width: '100%', justifyContent: 'flex-start', padding: '12px',
                      border: `1px solid ${currentAssigneeId === u.id ? 'var(--accent-blue)' : 'transparent'}`,
                      background: currentAssigneeId === u.id ? 'rgba(59,130,246,0.05)' : 'transparent'
                    }}
                    onClick={() => onAssign(u)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: 'var(--surface-hover)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <User size={16} color="var(--text-muted)" />
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.email}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> {u.designation || u.role}
                        </div>
                      </div>
                      {currentAssigneeId === u.id && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 700 }}>CURRENT</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
