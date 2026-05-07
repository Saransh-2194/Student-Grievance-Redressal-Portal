import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User as UserIcon, CheckCircle2, AlertTriangle, Info, Sun, Moon, X, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../lib/api';

import { useToast } from '../context/ToastContext';

import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Header({ isOpen, onToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  
  const socket = useSocket(); // Global socket for notifications

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

  // Keep input in sync with URL (back button, manual edits)
  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    
    // Update URL param
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    const eventName = `notification-${user.id}`;
    socket.on(eventName, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Use Custom Toast
      addToast(notification.message, notification.type || 'INFO');
    });

    return () => socket.off(eventName);
  }, [socket, user, addToast]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      addToast("All notifications marked as read", "SUCCESS");
    } catch (err) {
      addToast("Failed to mark all as read", "DANGER");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 size={16} color="var(--success)" />;
      case 'WARNING': return <AlertTriangle size={16} color="var(--warning)" />;
      case 'DANGER': return <AlertTriangle size={16} color="var(--danger)" />;
      default: return <Info size={16} color="var(--accent-blue)" />;
    }
  };

  return (
    <header className="main-header" style={{ padding: '0 40px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', height: '80px', display: 'flex', alignItems: 'center' }}>
      <button 
        className="btn-icon btn-ghost mobile-only" 
        style={{ marginRight: '16px' }}
        onClick={onToggle}
      >
        <Menu size={24} />
      </button>

      <div className="search-bar" style={{ width: '400px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', height: '44px', borderRadius: '8px', padding: '0 16px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search by title or category..." 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', width: '100%', outline: 'none' }}
          value={searchValue}
          onChange={handleSearch}
        />
      </div>

      <div className="header-actions" style={{ gap: '32px' }}>
        {/* Theme Toggle */}
        <button 
          className="btn-icon btn-ghost" 
          onClick={toggleTheme}
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notification Bell */}
        <div className="notification-wrapper" ref={dropdownRef} style={{ zIndex: 1100 }}>
          <button 
            className="btn-icon btn-ghost"
            style={{ position: 'relative', color: 'var(--text-secondary)' }}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', top: '10px', right: '10px', 
                width: '8px', height: '8px', background: 'var(--danger)', 
                borderRadius: '50%', border: '2px solid var(--bg-secondary)' 
              }} />
            )}
          </button>
          
          {showDropdown && (
            <div className="notification-dropdown" style={{ 
              position: 'absolute', top: '60px', right: 0, width: '320px', 
              background: 'var(--bg-primary)', border: '1px solid var(--border-color)', 
              borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden' 
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifications</h4>
                <button className="btn-text" style={{ fontSize: '0.75rem' }} onClick={markAllAsRead}>Clear All</button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No new updates</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', background: n.read ? 'transparent' : 'rgba(0,97,255,0.02)' }}>
                      <div style={{ marginTop: '2px' }}>{getIcon(n.type)}</div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{n.message}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button 
                  className="btn-text" 
                  style={{ fontSize: '0.8rem', fontWeight: 600 }}
                  onClick={() => { setShowDropdown(false); navigate('/dashboard/notifications'); }}
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="user-profile-summary" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/dashboard/profile')}>
          <div style={{ position: 'relative' }}>
            <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: '#52c41a', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name || user?.email?.split('@')[0] || 'User Name'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    </header>
  );
}
