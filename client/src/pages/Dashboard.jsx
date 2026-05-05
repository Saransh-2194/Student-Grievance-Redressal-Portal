import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import PublicDashboard from './PublicDashboard';
import SubmitComplaint from './SubmitComplaint';
import MyComplaints from './MyComplaints';
import AdminDashboard from './AdminDashboard';
import AuthorityDashboard from './AuthorityDashboard';
import EscalatedView from './EscalatedView';
import AuditLog from './AuditLog';
import Profile from './Profile';
import Settings from './Settings';
import Support from './Support';
import Notifications from './Notifications';
import Documentation from './Documentation';
import Header from '../components/Header';

export default function Dashboard() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={`page-layout ${isSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="main-container">
        <Header isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className="main-content">
          <Routes>
            <Route index element={<PublicDashboard />} />
            
            {/* Student routes */}
            {user?.role === 'STUDENT' && (
              <>
                <Route path="submit" element={<SubmitComplaint />} />
                <Route path="my" element={<MyComplaints />} />
              </>
            )}

            {/* Admin routes */}
            {user?.role === 'ADMIN' && (
              <Route path="admin" element={<AdminDashboard />} />
            )}

            {/* Authority routes */}
            {user?.role === 'AUTHORITY' && (
              <>
                <Route path="authority" element={<AuthorityDashboard />} />
                <Route path="escalated" element={<EscalatedView />} />
                <Route path="audit" element={<AuditLog />} />
              </>
            )}

            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="support" element={<Support />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="documentation" element={<Documentation />} />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
