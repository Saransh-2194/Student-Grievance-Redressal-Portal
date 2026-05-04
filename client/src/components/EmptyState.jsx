import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description, icon }) {
  const Icon = icon || Inbox;
  return (
    <div className="empty-state">
      <Icon size={48} />
      <h3>{title || 'Nothing here yet'}</h3>
      <p style={{ fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto' }}>
        {description || 'No data to display at this time.'}
      </p>
    </div>
  );
}
