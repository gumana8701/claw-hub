'use client';

import { useState } from 'react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    agent_webhook_url?: string;
    agent_name?: string;
    icon?: string;
  }) => Promise<void>;
}

export default function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        agent_webhook_url: webhookUrl.trim() || undefined,
        agent_name: agentName.trim() || undefined,
      });
      setName('');
      setDescription('');
      setWebhookUrl('');
      setAgentName('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    outline: 'none',
    background: 'var(--bg-app)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    fontFamily: 'inherit',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ padding: 16, background: 'rgba(5,10,26,0.8)' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
          New Channel
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Channel name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Agent name (optional)"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
          <input
            type="url"
            placeholder="Agent webhook URL (optional)"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            style={inputStyle}
          />

          <div className="flex" style={{ gap: 12, paddingTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--bg-surface-raised)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 600,
                background: 'var(--gradient-brand)',
                color: '#fff',
                border: 'none',
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              {loading ? '...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
