import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Send, Image as ImageIcon, AlertCircle, Shield, Info, ChevronRight, Eye, EyeOff, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'Academics', 'Hostel', 'Mess & Canteen', 'Medical', 
  'Housekeeping', 'Student Affairs', 'General Issues', 'Personal'
];

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Low', desc: 'Minor issue', color: 'var(--success)' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Standard', color: 'var(--warning)' },
  { value: 'HIGH', label: 'High', desc: 'Significant', color: 'var(--danger)' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Urgent', color: '#ff3333' },
];

export default function SubmitComplaint() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General Issues',
    severity: 'MEDIUM',
    visibility: 'PUBLIC',
    isAnonymous: false
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('attachment', file);

    try {
      await axios.post(`${API_URL}/complaints`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
      addToast("Grievance submitted successfully!", "SUCCESS");
    } catch (err) {
      addToast(err.response?.data?.error || "Submission failed", "DANGER");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', maxWidth: '500px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(82,196,26,0.1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
          }}>
            <CheckCircle size={40} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Submission Successful!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
            Your grievance has been logged and anchored to the blockchain for permanent tracking.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" style={{ padding: '12px 24px' }} onClick={() => navigate('/dashboard/my')}>
              My Grievances
            </button>
            <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => { setSubmitted(false); setFormData({ title: '', description: '', category: 'General Issues', severity: 'MEDIUM', visibility: 'PUBLIC' }); setFile(null); }}>
              File Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Shield size={18} /> Secure Submission Portal
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '16px', color: 'var(--text-primary)' }}>File a New Grievance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px' }}>
          Provide clear information to help our administrators address your concern effectively. All data is handled with institutional confidentiality.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Grievance Title</label>
              <input 
                type="text"
                placeholder="Brief summary of the problem"
                value={formData.title}
                onChange={(e) => update('title', e.target.value)}
                required
                style={{ width: '100%', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Detailed Description</label>
              <textarea 
                placeholder="Explain the situation in detail..."
                value={formData.description}
                onChange={(e) => update('description', e.target.value)}
                required
                style={{ width: '100%', minHeight: '220px', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
              />
            </div>

            <div style={{ padding: '32px', background: 'var(--bg-primary)', borderRadius: '16px', border: '2px dashed var(--border-color)', textAlign: 'center', transition: 'all 0.2s ease' }}>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0,97,255,0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={28} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, margin: '0 0 4px 0', fontSize: '1rem' }}>{file ? file.name : 'Upload Evidence'}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Drag and drop or click to browse (Max 5MB)</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classification</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Category</label>
              <select 
                value={formData.category}
                onChange={(e) => update('category', e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Severity</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {SEVERITY_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => update('severity', s.value)}
                    style={{ padding: '10px 4px', borderRadius: '8px', background: formData.severity === s.value ? `${s.color}15` : 'var(--bg-secondary)', border: `1px solid ${formData.severity === s.value ? s.color : 'var(--border-color)'}`, color: formData.severity === s.value ? s.color : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Visibility</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => update('visibility', 'PUBLIC')}
                  style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', background: formData.visibility === 'PUBLIC' ? 'rgba(0,97,255,0.05)' : 'transparent', border: `1px solid ${formData.visibility === 'PUBLIC' ? 'var(--accent-blue)' : 'var(--border-color)'}`, cursor: 'pointer', textAlign: 'left' }}
                >
                  <Eye size={16} color={formData.visibility === 'PUBLIC' ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: formData.visibility === 'PUBLIC' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Public</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Visible to community</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => update('visibility', 'PERSONAL')}
                  style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', background: formData.visibility === 'PERSONAL' ? 'rgba(124,58,237,0.05)' : 'transparent', border: `1px solid ${formData.visibility === 'PERSONAL' ? 'var(--accent-violet)' : 'var(--border-color)'}`, cursor: 'pointer', textAlign: 'left' }}
                >
                  <EyeOff size={16} color={formData.visibility === 'PERSONAL' ? 'var(--accent-violet)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: formData.visibility === 'PERSONAL' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Personal</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Only authority can view</div>
                  </div>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div style={{ position: 'relative', width: '40px', height: '20px' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isAnonymous} 
                    onChange={(e) => update('isAnonymous', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }} 
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: formData.isAnonymous ? 'var(--success)' : '#ccc', borderRadius: '20px', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', left: formData.isAnonymous ? '22px' : '2px', top: '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>File Anonymously</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Your identity will be hidden from public</div>
                </div>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '18px', fontSize: '1.1rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,97,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            {loading ? 'Submitting...' : 'Submit Grievance'}
            {!loading && <Send size={20} />}
          </button>
          
          <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(0,97,255,0.05)', borderRadius: '12px', border: '1px solid rgba(0,97,255,0.1)' }}>
            <Info size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Your submission will be timestamped and secured via blockchain hash for permanent audit tracking.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
