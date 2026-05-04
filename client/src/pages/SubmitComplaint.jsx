import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react';

import { API_URL } from '../lib/api';

const CATEGORIES = [
  'General Issues', 'Academics', 'Hostel', 'Mess & Canteen',
  'Housekeeping', 'Student Affairs', 'Medical', 'Personal'
];

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Low', desc: 'Minor inconvenience', color: 'var(--success)' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Noticeable issue', color: 'var(--warning)' },
  { value: 'HIGH', label: 'High', desc: 'Significant problem', color: 'var(--danger)' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Urgent attention', color: '#ff3333' },
];

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'General Issues', severity: 'LOW', visibility: 'PUBLIC'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [attachment, setAttachment] = useState(null);

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('severity', formData.severity);
      data.append('visibility', formData.visibility);
      if (attachment) {
        data.append('attachment', attachment);
      }

      await axios.post(`${API_URL}/complaints`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Is the server running?');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
          }}>
            <CheckCircle size={32} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Complaint Submitted!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px' }}>
            Your complaint has been recorded and a blockchain transaction is being created for immutable tracking.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard/my')}>
              View My Complaints
            </button>
            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setFormData({ title: '', description: '', category: 'General Issues', severity: 'LOW', visibility: 'PUBLIC' }); setAttachment(null); }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Submit a Complaint</h1>
        <p>All submissions are recorded on the blockchain for transparency</p>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Title */}
          <div>
            <label className="label">Title</label>
            <input
              className="input-field"
              placeholder="Brief summary of the issue"
              value={formData.title}
              onChange={e => update('title', e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field"
              placeholder="Provide detailed information about the issue, including dates, locations, and people involved..."
              rows={6}
              value={formData.description}
              onChange={e => update('description', e.target.value)}
              required
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="label">Attachment (Proof)</label>
            <input
              type="file"
              className="input-field"
              style={{ padding: '8px' }}
              onChange={e => setAttachment(e.target.files[0])}
              accept="image/*,.pdf,.doc,.docx"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Upload images or documents that support your grievance (max 5MB).
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                    background: formData.category === cat ? 'rgba(59,130,246,0.12)' : 'var(--surface)',
                    border: `1px solid ${formData.category === cat ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    color: formData.category === cat ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontSize: '0.85rem', fontWeight: formData.category === cat ? 600 : 400,
                    cursor: 'pointer', transition: 'all var(--transition-fast)', textAlign: 'left'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="label">Severity</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {SEVERITY_OPTIONS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => update('severity', s.value)}
                  style={{
                    padding: '12px 10px', borderRadius: 'var(--radius-md)',
                    background: formData.severity === s.value ? `${s.color}15` : 'var(--surface)',
                    border: `1px solid ${formData.severity === s.value ? s.color : 'var(--border-color)'}`,
                    cursor: 'pointer', textAlign: 'center', transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: formData.severity === s.value ? s.color : 'var(--text-primary)', marginBottom: '2px' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="label">Visibility</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="card"
                onClick={() => update('visibility', 'PUBLIC')}
                style={{
                  cursor: 'pointer', padding: '16px', textAlign: 'left',
                  borderColor: formData.visibility === 'PUBLIC' ? 'var(--accent-blue)' : undefined,
                  background: formData.visibility === 'PUBLIC' ? 'rgba(59,130,246,0.06)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Eye size={18} color={formData.visibility === 'PUBLIC' ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Public</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Visible to all students. Others can upvote to increase community impact.
                </p>
              </button>
              <button
                type="button"
                className="card"
                onClick={() => update('visibility', 'PERSONAL')}
                style={{
                  cursor: 'pointer', padding: '16px', textAlign: 'left',
                  borderColor: formData.visibility === 'PERSONAL' ? 'var(--warning)' : undefined,
                  background: formData.visibility === 'PERSONAL' ? 'rgba(245,158,11,0.06)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <EyeOff size={18} color={formData.visibility === 'PERSONAL' ? 'var(--warning)' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Personal</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Bypasses department. Only the highest authority can view. No voting allowed.
                </p>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ marginTop: '8px', opacity: submitting ? 0.7 : 1 }}>
            <Send size={18} /> {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
}
