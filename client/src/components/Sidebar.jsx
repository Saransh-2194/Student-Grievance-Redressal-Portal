import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, Shield, AlertTriangle,
  LogOut, ClipboardList, Eye, Users, ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (p) => path === p || path.startsWith(p + '/');

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Grievance</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Blockchain Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 16px 6px', marginTop: '4px' }}>
          Overview
        </div>
        <button className={`nav-item ${isActive('/dashboard') && !isActive('/dashboard/submit') && !isActive('/dashboard/my') && !isActive('/dashboard/admin') && !isActive('/dashboard/authority') ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
          <LayoutDashboard size={18} /> Public Dashboard
        </button>

        {/* Student-specific */}
        {user?.role === 'STUDENT' && (
          <>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 16px 6px', marginTop: '12px' }}>
              Student
            </div>
            <button className={`nav-item ${isActive('/dashboard/submit') ? 'active' : ''}`} onClick={() => navigate('/dashboard/submit')}>
              <PlusCircle size={18} /> Submit Complaint
            </button>
            <button className={`nav-item ${isActive('/dashboard/my') ? 'active' : ''}`} onClick={() => navigate('/dashboard/my')}>
              <FileText size={18} /> My Complaints
            </button>
          </>
        )}

        {/* Admin-specific */}
        {user?.role === 'ADMIN' && (
          <>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 16px 6px', marginTop: '12px' }}>
              Department Admin
            </div>
            <button className={`nav-item ${isActive('/dashboard/admin') ? 'active' : ''}`} onClick={() => navigate('/dashboard/admin')}>
              <ClipboardList size={18} /> Department Queue
            </button>
          </>
        )}

        {/* Authority-specific */}
        {user?.role === 'AUTHORITY' && (
          <>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 16px 6px', marginTop: '12px' }}>
              Higher Authority
            </div>
            <button className={`nav-item ${isActive('/dashboard/authority') ? 'active' : ''}`} onClick={() => navigate('/dashboard/authority')}>
              <Eye size={18} /> All Complaints
            </button>
            <button className={`nav-item ${isActive('/dashboard/escalated') ? 'active' : ''}`} onClick={() => navigate('/dashboard/escalated')}>
              <AlertTriangle size={18} /> Escalated
            </button>
            <button className={`nav-item ${isActive('/dashboard/audit') ? 'active' : ''}`} onClick={() => navigate('/dashboard/audit')}>
              <Users size={18} /> Audit Log
            </button>
          </>
        )}
      </nav>

      {/* User Info */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--gradient-accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role} {user?.department?.name ? `• ${user.department.name}` : ''}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }} onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
