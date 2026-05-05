import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Award, Clock, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ email: user?.email });

  const handleUpdate = (e) => {
    e.preventDefault();
    addToast("Profile update feature coming soon to production!", "INFO");
    setShowModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>User Profile</h1>
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
              {user?.email[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>{user?.email.split('@')[0]}</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className={`badge badge-${user?.role.toLowerCase()}`}>{user?.role}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ID: #{user?.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Email Address</label>
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={16} color="var(--text-muted)" />
                <span style={{ fontWeight: 600 }}>{user?.email}</span>
              </div>
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Account Type</label>
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={16} color="var(--text-muted)" />
                <span style={{ fontWeight: 600 }}>Institutional {user?.role}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => setShowModal(true)}>Update Information</button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
            <div className="glass-panel" style={{ width: '400px', padding: '32px', position: 'relative', animation: 'scaleUp 0.2s ease' }}>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Update Profile</h3>
              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>Save Changes</button>
              </form>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>Contribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Award size={16} /> Total Grievances
                </div>
                <span style={{ fontWeight: 700 }}>12</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Clock size={16} /> Resolved
                </div>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>08</span>
              </div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(0,97,255,0.05)', border: '1px solid var(--accent-blue)' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
               Your account is verified by the institutional authority. All actions are logged for audit purposes.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
