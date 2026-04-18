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

const ICONS = ['🤖', '⚡', '🧠', '🔥', '💬', '🛠️', '📊', '🎯', '🌐', '🔮', '🚀', '💎'];

export default function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [agentName, setAgentName] = useState('');
  const [icon, setIcon] = useState('🤖');
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
        icon,
      });
      setName('');
      setDescription('');
      setWebhookUrl('');
      setAgentName('');
      setIcon('🤖');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--bg-tertiary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">New Channel</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all"
                  style={{
                    background: icon === i ? 'var(--accent)' : 'var(--bg-primary)',
                    border: icon === i ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Channel name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          <input
            type="text"
            placeholder="Agent name (optional)"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          <input
            type="url"
            placeholder="Agent webhook URL (optional)"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? '...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
