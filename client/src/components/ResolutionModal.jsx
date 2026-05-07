import { X, Upload, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ResolutionModal({ isOpen, onClose, onResolve }) {
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onResolve(note, file);
    setNote('');
    setFile(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', background: 'var(--bg-primary)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Resolve Grievance</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Provide resolution details and supporting evidence.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Resolution Note</label>
            <textarea
              className="input-field"
              placeholder="Explain how the issue was resolved..."
              style={{ minHeight: '120px', resize: 'none', padding: '12px' }}
              value={note}
              onChange={e => setNote(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Supportive Evidence (Proof)</label>
            <div 
              style={{ 
                border: '2px dashed var(--border-color)', 
                borderRadius: '12px', 
                padding: '24px', 
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => document.getElementById('resolution-file').click()}
            >
              <Upload size={24} color={file ? 'var(--success)' : 'var(--text-muted)'} style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: file ? 'var(--success)' : 'var(--text-primary)' }}>
                {file ? file.name : 'Upload image or document'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                PDF, PNG, JPG up to 10MB
              </div>
              <input 
                id="resolution-file"
                type="file" 
                style={{ display: 'none' }} 
                onChange={e => setFile(e.target.files[0])}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--success)' }}>Complete Resolution</button>
          </div>
        </form>
      </div>
    </div>
  );
}
