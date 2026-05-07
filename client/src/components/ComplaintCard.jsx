import { useState, useEffect } from 'react';
import { 
  ChevronUp, ChevronDown, Clock, Tag, Link2, AlertTriangle, 
  TrendingUp, FileText, ChevronRight, CheckCircle2, XCircle, 
  User as UserIcon, MessageSquare, Send, History, ShieldAlert,
  Info, ExternalLink, GitBranch, ArrowUpCircle, Shield, Trash2
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import EscalationTimeline from './EscalationTimeline';
import AssignModal from './AssignModal';
import ResolutionModal from './ResolutionModal';

const formatDate = (d, exact = false) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  if (exact) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return date.toLocaleString('en-IN', options);
};

const formatTime = (d) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const getSlaInfo = (deadline) => {
  if (!deadline) return { text: 'No SLA', color: 'var(--text-muted)' };
  const diff = new Date(deadline).getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (diff < 0) return { text: 'SLA Breached', color: 'var(--danger)', icon: <ShieldAlert size={14} /> };
  if (days > 0) return { text: `${days}d remaining`, color: days < 2 ? 'var(--warning)' : 'var(--success)' };
  return { text: `${hours}h remaining`, color: 'var(--warning)' };
};

export default function ComplaintCard({ complaint, onVote, onStatusChange, userRole, showActions = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [localComplaint, setLocalComplaint] = useState(complaint);
  const [resolutionNote, setResolutionNote] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [hierarchyError, setHierarchyError] = useState(null);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  const socket = useSocket(complaint.id);

  useEffect(() => {
    if (!socket) return;

    socket.on('new-comment', (comment) => {
      setLocalComplaint(prev => ({
        ...prev,
        comments: [...(prev.comments || []), comment]
      }));
      if (isExpanded) addToast("New comment received", "INFO");
    });

    socket.on('status-updated', ({ status }) => {
      setLocalComplaint(prev => ({ ...prev, status }));
      addToast(`Ticket status updated to ${status}`, "SUCCESS");
    });

    return () => {
      socket.off('new-comment');
      socket.off('status-updated');
    };
  }, [socket, isExpanded, addToast]);

  useEffect(() => {
    setLocalComplaint(complaint);
  }, [complaint]);

  const c = localComplaint;
  const scoreColor = c.impactScore > 0 ? 'var(--success)' : c.impactScore < 0 ? 'var(--danger)' : 'var(--text-muted)';
  const sla = getSlaInfo(c.slaDeadline);

  useEffect(() => {
    if (activeTab === 'hierarchy' && !hierarchyData) {
      fetchHierarchy();
    }
  }, [activeTab]);

  const fetchHierarchy = async () => {
    setIsLoadingHierarchy(true);
    setHierarchyError(null);
    try {
      const res = await axios.get(`${API_URL}/complaints/${c.id}/chain`);
      setHierarchyData(res.data);
    } catch (err) {
      console.error("Failed to fetch hierarchy:", err);
      setHierarchyError("Failed to load hierarchy information. Please try again.");
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  const handleEscalate = async () => {
    setIsEscalating(true);
    try {
      const res = await axios.post(`${API_URL}/complaints/${c.id}/escalate`);
      addToast("Ticket successfully escalated", "SUCCESS");
      setLocalComplaint(prev => ({ 
        ...prev, 
        currentChainIndex: res.data.currentChainIndex,
        assignedToId: res.data.assignedToId,
        status: 'ESCALATED',
        isEscalated: true
      }));
      fetchHierarchy();
    } catch (err) {
      addToast(err.response?.data?.error || "Escalation failed", "DANGER");
    } finally {
      setIsEscalating(false);
    }
  };

  const handleAssign = async (targetUser) => {
    try {
      await axios.post(`${API_URL}/complaints/${c.id}/assign`, { userId: targetUser.id });
      addToast(`Ticket assigned to ${targetUser.email}`, "SUCCESS");
      setLocalComplaint(prev => ({ 
        ...prev, 
        assignedToId: targetUser.id, 
        assignedTo: { email: targetUser.email, role: targetUser.role },
        status: 'ASSIGNED'
      }));
      setIsAssignModalOpen(false);
      fetchHierarchy();
    } catch (err) {
      addToast(err.response?.data?.error || "Assignment failed", "DANGER");
    }
  };

  const handleDelete = async () => {
    console.log('[DEBUG] Deletion check:', { currentUserId: user?.id, ownerId: c.userId, role: user?.role });
    if (!window.confirm("Are you sure you want to permanently delete this grievance? This action cannot be undone.")) {
      return;
    }

    const toastId = addToast("Deleting grievance...", "INFO");
    try {
      await axios.delete(`${API_URL}/complaints/${c.id}`);
      addToast("Grievance deleted successfully", "SUCCESS");
      setIsExpanded(false);
      // Trigger a refresh of the parent list if needed (via window event or refresh prop)
      window.dispatchEvent(new CustomEvent('ticket-refresh'));
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Failed to delete grievance";
      addToast(errMsg, "DANGER");
    } finally {
      // toastId logic if applicable, otherwise just finish
    }
  };

  const handleStatusUpdate = async (newStatus, note, file) => {
    const formData = new FormData();
    formData.append('status', newStatus);
    if (note) formData.append('resolutionProof', note);
    if (file) formData.append('proof', file);
    try {
      await axios.put(`${API_URL}/complaints/${c.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast(`Status changed to ${newStatus}`, "SUCCESS");
      setLocalComplaint(prev => ({ ...prev, status: newStatus }));
      setIsResolutionModalOpen(false);
      onUpdate?.();
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to update status", "DANGER");
    }
  };

  const handleClaim = async () => {
    try {
      await axios.post(`${API_URL}/complaints/${c.id}/assign`);
      addToast("Ticket successfully claimed", "SUCCESS");
      setLocalComplaint(prev => ({ 
        ...prev, 
        assignedToId: user.id, 
        assignedTo: { email: user.email, role: user.role },
        status: 'ASSIGNED' 
      }));
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to claim ticket", "DANGER");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setIsSubmittingComment(true);
    try {
      await axios.post(`${API_URL}/complaints/${c.id}/comment`, { text: commentInput });
      setCommentInput('');
      addToast("Comment posted", "SUCCESS");
    } catch (err) {
      addToast("Failed to post comment", "DANGER");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="glass-panel" style={{ 
        padding: '20px 24px', 
        marginBottom: '16px', 
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }} onClick={() => setIsExpanded(true)}>
        
        {/* Impact Score Section (Far Left) */}
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          minWidth: '60px', paddingRight: '24px', borderRight: '1px solid var(--border-color)' 
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor }}>
            {c.impactScore || 0}
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Impact
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              #{c.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`badge badge-${c.status.toLowerCase()}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
              {c.status.replace('_', ' ')}
            </span>
            {c.isAnonymous && (
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-violet)', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(139,92,246,0.2)' }}>
                ANONYMOUS
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {c.title}
          </h3>

          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} color="var(--text-muted)" />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{c.department?.name || 'Global'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 800 }}>
                {(c.user?.name || c.user?.email)?.[0].toUpperCase()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {c.user?.name || c.user?.email.split('@')[0]}
                {c.user?.rollNo && <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>({c.user.rollNo})</span>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.8rem' }}
          >
            Manage
          </button>
        </div>
      </div>
    );
  }

  // Expanded Details View (Matches Image 3)
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.4)', zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%', maxWidth: '1200px', height: '90vh', 
        background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
      }}>
        {/* Header Section */}
        <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{c.title}</h2>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status.replace('_', ' ')}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posted {timeAgo(c.createdAt)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user?.id === c.userId && (
              <button 
                className="btn btn-ghost" 
                onClick={handleDelete}
                style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
              >
                <Trash2 size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Delete Grievance</span>
              </button>
            )}
            <button className="btn-icon" onClick={() => setIsExpanded(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}>
              <XCircle size={20} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0 40px', borderBottom: '1px solid var(--border-color)', gap: '32px' }}>
          {['details', 'comments', 'hierarchy', 'history'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '16px 0', 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                background: 'transparent',
                color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '3px solid var(--accent-blue)' : '3px solid transparent',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
          
          {/* Main Content Area (Scrollable) */}
          <div style={{ overflowY: 'auto', padding: '40px' }}>
            
            {activeTab === 'details' && (
              <>
                <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Problem Description</h4>
                  <p style={{ lineHeight: 1.8, fontSize: '1rem', color: 'var(--text-primary)' }}>{c.description}</p>
                  {c.attachmentUrl && (
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                      <a href={c.attachmentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link2 size={16} /> View Original Attachment
                      </a>
                    </div>
                  )}
                </div>

                {/* Accept/Reject Section for Students */}
                {userRole === 'STUDENT' && c.status === 'RESOLVED' && c.isOwner && (
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--success)', background: 'rgba(82,196,26,0.05)', marginBottom: '32px' }}>
                    <h4 style={{ color: 'var(--success)', marginBottom: '12px', fontSize: '1rem', fontWeight: 700 }}>Verify Resolution</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>The department has marked this case as resolved. Please verify if the issue is settled.</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-primary" style={{ background: 'var(--success)', flex: 1 }} onClick={() => handleStatusUpdate('CLOSED')}>Accept & Close</button>
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleStatusUpdate('IN_PROGRESS')}>Reject & Reopen</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                  {c.comments?.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                        {(comment.user.name || comment.user.email)[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{comment.user.name || comment.user.email.split('@')[0]}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo(comment.createdAt)}</span>
                        </div>
                        <div className="glass-panel" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', fontSize: '0.9rem', borderRadius: '0 12px 12px 12px' }}>
                          {comment.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!c.comments || c.comments.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No comments yet.</div>
                  )}
                </div>
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <input 
                    className="input-field" 
                    placeholder="Write a comment..." 
                    style={{ border: 'none', background: 'transparent' }} 
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={isSubmittingComment}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'hierarchy' && (
              <div className="hierarchy-container">
                {isLoadingHierarchy ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
                ) : (
                  <EscalationTimeline chain={hierarchyData?.chain} currentIndex={hierarchyData?.currentIndex} logs={hierarchyData?.escalationLogs} />
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '32px' }}>
                {c.activityLogs?.map((log) => (
                  <div key={log.id} style={{ position: 'relative', marginBottom: '32px' }}>
                    <div style={{ position: 'absolute', left: '-39px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-blue)', border: '3px solid var(--bg-primary)' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{log.action.replace('_', ' ')}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{formatDate(log.timestamp, true)}</div>
                    <div className="glass-panel" style={{ padding: '12px', background: 'var(--bg-secondary)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.details || log.newValue || 'No additional details.'}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div style={{ borderLeft: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', padding: '32px', overflowY: 'auto' }}>
            
            <div style={{ marginBottom: '32px' }}>
              <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.05em' }}>Impact & Verification</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    className={`btn-icon ${c.userVote === 'UP' ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onVote?.(c.id, 'UP'); }}
                    style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,97,255,0.1)', color: 'var(--accent-blue)', border: 'none', cursor: 'pointer' }}
                  >
                    <ChevronUp size={24} />
                  </button>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{c.upvotes || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Community Votes</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124,58,237,0.1)', color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{c.impactScore || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Impact Score</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Grievance Details</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category:</span> <span style={{ fontWeight: 600 }}>{c.category}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Severity:</span> <span className={`badge badge-${c.severity.toLowerCase()}`}>{c.severity}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID:</span> <span style={{ fontWeight: 600 }}>#{c.id.slice(0,8).toUpperCase()}</span></div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Assigned To</h5>
              {c.assignedTo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {c.assignedTo.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.assignedTo.name || c.assignedTo.email.split('@')[0]}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.assignedTo.role}</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Awaiting Agent Assignment
                </div>
              )}
            </div>

            {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,97,255,0.05)', border: '1px solid var(--accent-blue)' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '16px' }}>Admin Command</h5>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {!c.assignedToId && (
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleClaim}>Claim Ownership</button>
                  )}

                  {/* Resolve Button: Visible if unassigned OR if assigned to current user OR if Super Admin */}
                  {( !c.assignedToId || c.assignedToId === user.id || userRole === 'SUPER_ADMIN' ) && c.status !== 'RESOLVED' && (
                    <button className="btn btn-primary" style={{ width: '100%', background: 'var(--success)' }} onClick={() => setIsResolutionModalOpen(true)}>Mark Resolved</button>
                  )}

                  {/* Reassign & Escalate: Visible if assigned to current user OR if Super Admin */}
                  {( c.assignedToId === user.id || userRole === 'SUPER_ADMIN' ) && (
                    <>
                      <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setIsAssignModalOpen(true)}>Reassign Ticket</button>
                      <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--accent-violet)' }} onClick={handleEscalate} disabled={isEscalating}>
                        {isEscalating ? 'Escalating...' : 'Escalate to Higher Level'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AssignModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        onAssign={handleAssign}
        currentAssigneeId={c.assignedToId}
      />

      <ResolutionModal 
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        onResolve={(note, file) => handleStatusUpdate('RESOLVED', note, file)}
      />
    </div>
  );
}
