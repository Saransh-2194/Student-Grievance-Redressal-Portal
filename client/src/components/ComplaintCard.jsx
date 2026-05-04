import { useState, useEffect } from 'react';
import { 
  ChevronUp, ChevronDown, Clock, Tag, Link2, AlertTriangle, 
  TrendingUp, FileText, ChevronRight, CheckCircle2, XCircle, 
  User as UserIcon, MessageSquare, Send, History, ShieldAlert,
  Info, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

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

  // Sync with prop changes
  useEffect(() => {
    setLocalComplaint(complaint);
  }, [complaint]);

  const c = localComplaint;
  const scoreColor = c.impactScore > 0 ? 'var(--success)' : c.impactScore < 0 ? 'var(--danger)' : 'var(--text-muted)';
  const sla = getSlaInfo(c.slaDeadline);

  const handleStatusUpdate = async (newStatus) => {
    const formData = new FormData();
    formData.append('status', newStatus);
    if (resolutionNote) formData.append('resolutionProof', resolutionNote);
    if (proofFile) formData.append('proof', proofFile);
    
    try {
      await axios.put(`${API_URL}/complaints/${c.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResolutionNote('');
      setProofFile(null);
      addToast(`Status changed to ${newStatus}`, "SUCCESS");
      
      // We don't call fetchDept here because the socket should handle it, 
      // but for immediate local feel:
      setLocalComplaint(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to update status", "DANGER");
    }
  };

  const handleClaim = async () => {
    try {
      await axios.post(`${API_URL}/complaints/${c.id}/assign`);
      addToast("Ticket successfully claimed", "SUCCESS");
      // Set both assignedToId and assignedTo object to ensure UI updates
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

  return (
    <div className={`card ${isExpanded ? 'expanded' : 'card-interactive'}`} style={{
      padding: 0,
      overflow: 'hidden',
      borderLeft: c.status === 'ESCALATED' ? '4px solid var(--accent-violet)' : c.slaBreached ? '4px solid var(--danger)' : '1px solid var(--card-border)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      marginBottom: '16px'
    }}>
      {/* ── Ticket Header (Balanced Collapsed View) ── */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px', 
          cursor: 'pointer',
        }}
      >
        {/* Left Side: ID & Voting Quick View */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', gap: '4px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>#{c.id.substring(0, 6)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: scoreColor, fontSize: '0.9rem', fontWeight: 700 }}>
             <TrendingUp size={14} /> {c.impactScore || 0}
          </div>
        </div>

        {/* Center: Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.title}
            </h3>
            <span className={`badge badge-${c.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{c.status.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={12} /> {c.category}</span>
             {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
               <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: sla.color }}>
                 {sla.icon || <Clock size={12} />} {sla.text}
               </span>
             )}
             {c.assignedTo && (
               <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <UserIcon size={12} /> {c.assignedTo.email.split('@')[0]}
               </span>
             )}
          </div>
        </div>

        {/* Right Side: Action Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }}>
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      {/* ── Extended Ticket View ── */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          {/* Internal Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border-color)', padding: '0 24px' }}>
            {['details', 'comments', 'history'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '16px 24px', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  background: 'transparent',
                  color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab ? '3px solid var(--accent-blue)' : '3px solid transparent',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding: '32px 24px' }}>
            {activeTab === 'details' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' }}>
                {/* Main Content Area */}
                <div>
                  <div style={{ marginBottom: '32px' }}>
                    <h4 className="label" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} /> Description
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                      {c.description}
                    </p>
                  </div>

                  {c.attachmentUrl && (
                    <div style={{ marginBottom: '32px' }}>
                      <h4 className="label" style={{ marginBottom: '16px' }}>Evidence & Attachments</h4>
                      <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
                        <ExternalLink size={16} /> View Full Resolution Attachment
                      </a>
                    </div>
                  )}

                  {c.status === 'RESOLVED' && c.resolutionProof && (
                    <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: '24px', borderRadius: 'var(--radius-lg)', marginTop: '24px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>
                         <CheckCircle2 size={18} /> Official Resolution Evidence
                       </div>
                       {c.resolutionProof.startsWith('http') ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>The admin has attached a proof document/image for this resolution.</p>
                           <a href={c.resolutionProof} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', width: 'fit-content' }}>
                             <ExternalLink size={16} /> View Resolution Proof
                           </a>
                         </div>
                       ) : (
                         <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>{c.resolutionProof}</p>
                       )}
                    </div>
                  )}
                </div>

                {/* Sidebar Controls (Balanced Metadata) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="card" style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                    <h4 className="label" style={{ marginBottom: '16px' }}>Audit Details</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Created</span>
                        <span style={{ fontWeight: 500 }}>{formatDate(c.createdAt, true)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Priority</span>
                        <span className={`badge badge-${c.severity.toLowerCase()}`}>{c.severity}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Visibility</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.visibility === 'PUBLIC' ? <Info size={12} /> : <ShieldAlert size={12} />} {c.visibility}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                    <h4 className="label" style={{ marginBottom: '16px' }}>Community Feedback</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                      <div style={{ textAlign: 'center' }}>
                        <button 
                          className="vote-btn" 
                          style={{ margin: '0 auto 8px' }}
                          onClick={(e) => { e.stopPropagation(); onVote?.(c.id, 'UP'); }}
                        >
                          <ChevronUp size={24} color="var(--success)" />
                        </button>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{c.upvotes || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support</div>
                      </div>
                      
                      <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />

                      <div style={{ textAlign: 'center' }}>
                        <button 
                          className="vote-btn" 
                          style={{ margin: '0 auto 8px' }}
                          onClick={(e) => { e.stopPropagation(); onVote?.(c.id, 'DOWN'); }}
                        >
                          <ChevronDown size={24} color="var(--danger)" />
                        </button>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{c.downvotes || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispute</div>
                      </div>
                    </div>
                  </div>

                  {showActions && (
                    <div className="card" style={{ padding: '20px', border: '1px solid var(--accent-blue)', background: 'rgba(59, 130, 246, 0.02)' }}>
                      <h4 className="label" style={{ marginBottom: '16px', color: 'var(--accent-blue)' }}>Workflow Actions</h4>
                      {!c.assignedTo ? (
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleClaim}>Claim Ticket</button>
                      ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Status Change</span>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['IN_PROGRESS', 'UNDER_REVIEW', 'ESCALATED'].map(s => (
                                  <button 
                                    key={s} 
                                    className={`btn btn-sm ${c.status === s ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => handleStatusUpdate(s)}
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {s.replace('_', ' ')}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <h5 style={{ fontSize: '0.8rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Submit Final Resolution</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <textarea 
                                    className="input-field" 
                                    placeholder="Final resolution note..."
                                    style={{ fontSize: '0.85rem', minHeight: '60px' }}
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attach Proof (Image/Doc)</span>
                                    <input 
                                      type="file" 
                                      onChange={(e) => setProofFile(e.target.files[0])}
                                      style={{ fontSize: '0.75rem' }}
                                    />
                                  </div>
                                  <button 
                                    className="btn btn-success" 
                                    style={{ width: '100%', marginTop: '4px' }}
                                    onClick={() => handleStatusUpdate('RESOLVED')}
                                  >
                                    Mark as Resolved
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                      )}
                    </div>
                  )}

                  {userRole === 'STUDENT' && c.status === 'RESOLVED' && (
                    <div className="card" style={{ padding: '20px', border: '1px solid var(--success)', background: 'rgba(16,185,129,0.02)' }}>
                      <h4 className="label" style={{ marginBottom: '16px', color: 'var(--success)' }}>Student Confirmation</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         <button className="btn btn-primary" style={{ background: 'var(--success)', width: '100%' }} onClick={() => handleStatusUpdate('CLOSED')}>Accept & Close</button>
                         <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleStatusUpdate('IN_PROGRESS')}>Reject & Reopen</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div style={{ maxWidth: '900px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
                  {c.comments && c.comments.length > 0 ? c.comments.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: comment.user.role === 'ADMIN' ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <UserIcon size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{comment.user.email.split('@')[0]}</span>
                          <span className={`badge badge-${comment.user.role.toLowerCase()}`} style={{ fontSize: '0.6rem' }}>{comment.user.role}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{timeAgo(comment.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', background: 'var(--surface)', padding: '16px', borderRadius: '0 16px 16px 16px', border: '1px solid var(--border-color)', lineHeight: 1.6 }}>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                      <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No communication recorded yet. Start the conversation below.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
                   <textarea 
                    className="input-field"
                    placeholder="Type a professional update or query..."
                    style={{ minHeight: '80px', fontSize: '0.9rem', padding: '16px' }}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                   />
                   <button type="submit" className="btn btn-primary" disabled={isSubmittingComment} style={{ alignSelf: 'flex-end', height: '48px', width: '48px', borderRadius: '12px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Send size={20} />
                   </button>
                </form>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="timeline" style={{ maxWidth: '700px' }}>
                {c.activityLogs && c.activityLogs.length > 0 ? c.activityLogs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-dot" style={{ 
                      background: log.action === 'SLA_BREACH' ? 'var(--danger)' : 
                                 log.action === 'STATUS_CHANGE' ? 'var(--accent-blue)' : 
                                 log.action === 'ASSIGNMENT' ? 'var(--success)' :
                                 'var(--text-muted)' 
                    }} />
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>{log.action.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{formatDate(log.timestamp)} {formatTime(log.timestamp)}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                        {log.oldValue && <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{log.oldValue}</span>}
                        {log.oldValue && <span style={{ margin: '0 8px' }}>→</span>}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.newValue || log.details}</span>
                      </div>
                    </div>
                  </div>
                )) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Audit log is empty for this ticket.</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
