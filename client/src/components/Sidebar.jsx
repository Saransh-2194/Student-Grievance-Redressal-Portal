import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard, PlusCircle, FileText, Shield, AlertTriangle,
  LogOut, ClipboardList, Eye, Users, ChevronDown, MessageSquare, Bell
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [openMenus, setOpenMenus] = useState(['complaints']);

  const nav = (p) => {
    navigate(p);
    onClose(); // Close sidebar on mobile after navigation
  };

  const toggleMenu = (menu) => {
    setOpenMenus(prev => 
      prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (p) => path === p || (p !== '/dashboard' && path.startsWith(p));

  return (
    <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`} style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Logo */}
      <div style={{ padding: '32px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => nav('/dashboard')}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--accent-blue)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={22} color="white" fill="white" />
          </div>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            letterSpacing: '0.02em', 
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center'
          }}>
            COMPLAINT
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        <button 
          className={`nav-item ${path === '/dashboard' ? 'active' : ''}`} 
          onClick={() => nav('/dashboard')}
          style={{ height: '48px', padding: '0 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left' }}
        >
          <LayoutDashboard size={18} /> Dashboard
        </button>

        {/* Users Section (Authority only) */}
        {(user?.role === 'AUTHORITY' || user?.role === 'ADMIN') && (
          <div style={{ marginTop: '12px' }}>
            <button 
              className={`nav-item ${path.includes('/users') ? 'active' : ''}`} 
              onClick={() => toggleMenu('users')}
              style={{ height: '48px', padding: '0 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={18} /> Users
              </div>
              <ChevronDown size={14} style={{ transform: openMenus.includes('users') ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {openMenus.includes('users') && (
              <div style={{ paddingLeft: '42px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="btn-text" onClick={() => nav('/dashboard/admin/users')} style={{ justifyContent: 'flex-start', fontSize: '0.85rem', padding: '8px 0', opacity: path.includes('/users') ? 1 : 0.6, fontWeight: path.includes('/users') ? 700 : 400 }}>
                  User Management
                </button>
              </div>
            )}
          </div>
        )}

        {/* Complaints Section */}
        <div style={{ marginTop: '12px' }}>
          <button 
            className={`nav-item ${path.includes('/complaint') || path.includes('/submit') || path.includes('/my') || path.includes('/admin') || path.includes('/authority') ? 'active' : ''}`} 
            onClick={() => toggleMenu('complaints')}
            style={{ height: '48px', padding: '0 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={18} /> Complaints
            </div>
            <ChevronDown size={14} style={{ transform: openMenus.includes('complaints') ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
          </button>
          
          {openMenus.includes('complaints') && (
            <div style={{ paddingLeft: '42px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {user?.role === 'STUDENT' && (
                <>
                  <button className="btn-text" onClick={() => nav('/dashboard/submit')} style={{ justifyContent: 'flex-start', fontSize: '0.85rem', padding: '8px 0', opacity: path === '/dashboard/submit' ? 1 : 0.6, fontWeight: path === '/dashboard/submit' ? 700 : 400 }}>
                    New Complaint
                  </button>
                  <button className="btn-text" onClick={() => nav('/dashboard/my')} style={{ justifyContent: 'flex-start', fontSize: '0.85rem', padding: '8px 0', opacity: path === '/dashboard/my' ? 1 : 0.6, fontWeight: path === '/dashboard/my' ? 700 : 400 }}>
                    My Complaints
                  </button>
                </>
              )}
              {user?.role === 'ADMIN' && (
                <button className="btn-text" onClick={() => nav('/dashboard/admin')} style={{ justifyContent: 'flex-start', fontSize: '0.85rem', padding: '8px 0', opacity: path === '/dashboard/admin' ? 1 : 0.6, fontWeight: path === '/dashboard/admin' ? 700 : 400 }}>
                  Department List
                </button>
              )}
              {user?.role === 'AUTHORITY' && (
                <>
                  <button className="btn-text" onClick={() => nav('/dashboard/authority')} style={{ justifyContent: 'flex-start', fontSize: '0.85rem', padding: '8px 0', opacity: path === '/dashboard/authority' ? 1 : 0.6, fontWeight: path === '/dashboard/authority' ? 700 : 400 }}>
                    All Complaints
                  </button>
                  <button className="btn-text" onClick={() => nav('/dashboard/escalated')} style={{ justifyContent: 'flex-start', fontSize: '0.85rem', padding: '8px 0', opacity: path === '/dashboard/escalated' ? 1 : 0.6, fontWeight: path === '/dashboard/escalated' ? 700 : 400 }}>
                    Escalated List
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div style={{ marginTop: 'auto', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button className={`nav-item ${path === '/dashboard/notifications' ? 'active' : ''}`} onClick={() => nav('/dashboard/notifications')} style={{ height: '48px', padding: '0 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.8 }}>
            <Bell size={18} /> Notifications
          </button>
          <button className={`nav-item ${path === '/dashboard/support' ? 'active' : ''}`} onClick={() => nav('/dashboard/support')} style={{ height: '48px', padding: '0 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.8 }}>
            <PlusCircle size={18} /> Support
          </button>
          <button className={`nav-item ${path === '/dashboard/settings' ? 'active' : ''}`} onClick={() => nav('/dashboard/settings')} style={{ height: '48px', padding: '0 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LayoutDashboard size={18} /> Settings
            </div>
            <ChevronDown size={14} />
          </button>
          
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '16px 16px 0' }}>
            © Complaint 2023, All Rights Reserved.
          </p>
        </div>
      </nav>
    </div>
  );
}

