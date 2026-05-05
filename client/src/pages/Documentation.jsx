import { Book, Shield, Workflow, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function Documentation() {
  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book size={24} color="var(--accent-blue)" />,
      content: 'To file a grievance, navigate to the "New Complaint" section. You must provide a clear title, category, and description. Attaching evidence (images/documents) is highly recommended for faster resolution.'
    },
    {
      id: 'workflow',
      title: 'Understanding the Workflow',
      icon: <Workflow size={24} color="var(--accent-violet)" />,
      steps: [
        { status: 'CREATED', desc: 'Ticket is logged in the system.' },
        { status: 'ASSIGNED', desc: 'A department administrator has claimed the ticket.' },
        { status: 'IN_PROGRESS', desc: 'The authority is actively working on a resolution.' },
        { status: 'RESOLVED', desc: 'A solution has been proposed. Waiting for student verification.' },
        { status: 'CLOSED', desc: 'The student has accepted the resolution.' }
      ]
    },
    {
      id: 'security',
      title: 'Security & Transparency',
      icon: <Shield size={24} color="var(--success)" />,
      content: 'Every action is logged on a private blockchain to ensure immutability. Evidence is stored securely on AWS S3 with encrypted access. This dual-layer approach guarantees that your grievance cannot be deleted or tampered with.'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>Portal Documentation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Comprehensive guide to the Student Grievance Redressal System. Learn about workflows, security, and policies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '48px' }}>
        {/* Sticky Sidebar Nav */}
        <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Contents</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-blue)' }} />
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {sections.map(section => (
            <div key={section.id} id={section.id} className="glass-panel" style={{ padding: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                {section.icon}
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{section.title}</h2>
              </div>
              
              {section.content && (
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
                  {section.content}
                </p>
              )}

              {section.steps && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                  {section.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,97,255,0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                          {i + 1}
                        </div>
                        {i < section.steps.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', margin: '4px 0' }} />}
                      </div>
                      <div style={{ paddingBottom: i < section.steps.length - 1 ? '20px' : '0' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>{step.status}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Footer Card */}
          <div className="glass-panel" style={{ padding: '32px', background: 'var(--bg-primary)', border: '1px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: '4px' }}>Still need help?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Our support team is available 24/7 for critical issues.</p>
            </div>
            <button className="btn btn-primary">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
