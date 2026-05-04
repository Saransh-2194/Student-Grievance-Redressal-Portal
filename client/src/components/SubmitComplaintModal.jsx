import { useState } from 'react';
import axios from 'axios';
import { X, Send, AlertTriangle, Eye, EyeOff } from 'lucide-react';

import { API_URL } from '../lib/api';

const CATEGORIES = [
  'General Issues', 'Academics', 'Hostel', 'Mess & Canteen',
  'Housekeeping', 'Student Affairs', 'Medical', 'Personal'
];

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Low', desc: 'Minor inconvenience' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Noticeable issue' },
  { value: 'HIGH', label: 'High', desc: 'Significant problem' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Urgent attention needed' },
];

export default function SubmitComplaintModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General Issues',
    severity: 'LOW',
    visibility: 'PUBLIC'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
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
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>New Complaint</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Your submission will be recorded on the blockchain
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
              placeholder="Provide detailed information about the issue, including any relevant dates, locations, and people involved..."
              rows={5}
              value={formData.description}
              onChange={e => update('description', e.target.value)}
              required
            />
          </div>

          {/* Category + Severity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={formData.category} onChange={e => update('category', e.target.value)}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Severity</label>
              <select className="input-field" value={formData.severity} onChange={e => update('severity', e.target.value)}>
                {SEVERITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>)}
              </select>
            </div>
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Upload images or documents that support your grievance (max 5MB).
            </p>
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
                  cursor: 'pointer', padding: '14px 16px', textAlign: 'left',
                  borderColor: formData.visibility === 'PUBLIC' ? 'var(--accent-blue)' : undefined,
                  background: formData.visibility === 'PUBLIC' ? 'rgba(59,130,246,0.06)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Eye size={16} color={formData.visibility === 'PUBLIC' ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Public</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Visible to all students. Others can upvote to increase impact.
                </p>
              </button>
              <button
                type="button"
                className="card"
                onClick={() => update('visibility', 'PERSONAL')}
                style={{
                  cursor: 'pointer', padding: '14px 16px', textAlign: 'left',
                  borderColor: formData.visibility === 'PERSONAL' ? 'var(--warning)' : undefined,
                  background: formData.visibility === 'PERSONAL' ? 'rgba(245,158,11,0.06)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <EyeOff size={16} color={formData.visibility === 'PERSONAL' ? 'var(--warning)' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Personal</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Only the highest authority can see this. No voting.
                </p>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ flex: 2, opacity: submitting ? 0.7 : 1 }}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
