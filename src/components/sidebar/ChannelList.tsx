'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChannels } from '@/lib/hooks/useChannels';
import { createClient } from '@/lib/supabase/client';
import { Zap, Plus, LogOut } from 'lucide-react';
import ChannelItem from './ChannelItem';
import CreateChannelModal from './CreateChannelModal';

interface ChannelListProps {
  onChannelSelect?: () => void;
}

export default function ChannelList({ onChannelSelect }: ChannelListProps) {
  const { channels, loading, createChannel } = useChannels();
  const [showCreate, setShowCreate] = useState(false);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const activeId = params?.channelId as string | undefined;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <Zap size={20} style={{ color: 'var(--accent-violet)' }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
            ClawHub
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--gradient-brand)',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            transition: 'transform 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--gradient-brand-hover)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--gradient-brand)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="New Channel"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Channel List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        {loading ? (
          <div style={{ padding: '32px 12px', textAlign: 'center', fontSize: 14, color: 'var(--text-tertiary)' }}>
            Loading...
          </div>
        ) : channels.length === 0 ? (
          <div style={{ padding: '32px 12px', textAlign: 'center', fontSize: 14, color: 'var(--text-tertiary)' }}>
            No channels yet.<br />Create one to get started.
          </div>
        ) : (
          channels.map((ch) => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              isActive={activeId === ch.id}
              onClick={onChannelSelect}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          padding: '14px 20px',
          background: 'var(--bg-app)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={handleLogout}
          className="flex items-center w-full cursor-pointer"
          style={{
            gap: 8,
            color: 'var(--text-secondary)',
            fontSize: 13,
            background: 'none',
            border: 'none',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>

      <CreateChannelModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (data) => { await createChannel(data); }}
      />
    </div>
  );
}
