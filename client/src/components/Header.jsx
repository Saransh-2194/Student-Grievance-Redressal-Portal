import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User as UserIcon, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../lib/api';

import { useToast } from '../context/ToastContext';

export default function Header() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  
  const socket = useSocket(); // Global socket for notifications

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
    <header className="main-header">
      <div className="search-bar">
        <Search size={18} color="var(--text-muted)" />
        <input type="text" placeholder="Search tickets, IDs, or history..." />
      </div>

      <div className="header-actions">
        {/* Notification Bell */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            className={`notification-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </button>

          {showDropdown && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="btn-text" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}>
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="notif-icon">{getIcon(n.type)}</div>
                      <div className="notif-content">
                        <p>{n.message}</p>
                        <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {!n.read && <div className="unread-dot" />}
                    </div>
                  ))
                )}
              </div>
              
              <div className="dropdown-footer">
                <button className="btn-text" onClick={fetchNotifications}>Show recent updates</button>
              </div>
            </div>
          )}
        </div>

        <div className="user-profile-summary">
          <div className="user-text">
            <span className="user-name">{user?.email?.split('@')[0]}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <div className="user-avatar">
            <UserIcon size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
