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
import Header from '../components/Header';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-container">
        <Header />
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

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
