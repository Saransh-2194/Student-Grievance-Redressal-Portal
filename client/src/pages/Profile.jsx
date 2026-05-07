import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Award, Clock, X, BadgeCheck, Fingerprint, Briefcase } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    email: user?.email,
    name: user?.name || '',
    rollNo: user?.rollNo || '',
    authorityId: user?.authorityId || '',
    designation: user?.designation || ''
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    addToast("Profile update feature coming soon to production!", "INFO");
    setShowModal(false);
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Institutional Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your institutional identity and account details.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', gap: '32px', marginBottom: '48px', alignItems: 'center' }}>
            <div style={{ 
              width: 100, height: 100, borderRadius: '50%', 
              background: 'var(--accent-blue)', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 800,
              boxShadow: '0 10px 30px rgba(0,97,255,0.3)'
            }}>
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>{displayName}</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className={`badge badge-${user?.role.toLowerCase()}`}>{user?.role?.replace('_', ' ')}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ID: #{user?.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Full Name</label>
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <User size={16} color="var(--text-muted)" />
                <span style={{ fontWeight: 600 }}>{user?.name || 'Not Set'}</span>
              </div>
            </div>

            <div className="input-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Email Address</label>
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={16} color="var(--text-muted)" />
                <span style={{ fontWeight: 600 }}>{user?.email}</span>
              </div>
            </div>

            {user?.role === 'STUDENT' ? (
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Roll Number</label>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Fingerprint size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600 }}>{user?.rollNo || 'Not Assigned'}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{user?.role} ID</label>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BadgeCheck size={16} color="var(--text-muted)" />
                    <span style={{ fontWeight: 600 }}>{user?.authorityId || 'Not Assigned'}</span>
                  </div>
                </div>
                <div className="input-group" style={{ gridColumn: '1 / span 2' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Designation</label>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Briefcase size={16} color="var(--text-muted)" />
                    <span style={{ fontWeight: 600 }}>{user?.designation || 'Not Assigned'}</span>
                  </div>
                </div>
              </>
            )}

            {user?.department && (
              <div className="input-group" style={{ gridColumn: '1 / span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Associated Department</label>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600 }}>{user?.department.name}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => setShowModal(true)}>Update Profile Details</button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div className="glass-panel" style={{ width: '450px', padding: '40px', position: 'relative', animation: 'scaleUp 0.2s ease', background: 'var(--bg-primary)' }}>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>Edit Profile</h3>
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Full Name</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
                  <input 
                    type="email" 
                    className="input-field"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>Save Profile Changes</button>
              </form>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>Impact Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Award size={16} /> Tracked Grievances
                </div>
                <span style={{ fontWeight: 700 }}>{user?.role === 'STUDENT' ? '04' : 'All'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Clock size={16} /> Resolved
                </div>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>03</span>
              </div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(0,97,255,0.05)', border: '1px solid var(--accent-blue)' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
               Your institutional identity is verified. All submissions and comments are linked to your profile for security and accountability.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
