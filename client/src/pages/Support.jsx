import { useNavigate } from 'react-router-dom';
import { HelpCircle, MessageSquare, LifeBuoy, FileText, ExternalLink } from 'lucide-react';

export default function Support() {
  const navigate = useNavigate();
  const faqs = [
    { q: "How long does it take to resolve a grievance?", a: "Standard grievances are addressed within 48-72 business hours. High severity issues are prioritized." },
    { q: "Who can see my private grievances?", a: "Private grievances are only visible to you and the assigned administrative authority." },
    { q: "Can I reopen a closed grievance?", a: "Yes, if you are not satisfied with the resolution, you can reject it to reopen the case." }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Support Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Get help with the portal and understand the redressal process.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0,97,255,0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
             <MessageSquare size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Live Communication</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Chat directly with our administrative support team.</p>
          <button className="btn btn-primary" style={{ width: '100%' }}>Start Chat</button>
        </div>

        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
             <FileText size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Documentation</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Read the full user guide and redressal policy documents.</p>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/dashboard/documentation')}>View Docs</button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '40px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HelpCircle size={24} color="var(--accent-blue)" /> Frequently Asked Questions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {faqs.map((faq, i) => (
            <div key={i}>
              <p style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1rem' }}>{faq.q}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
