'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChannels } from '@/lib/hooks/useChannels';
import { createClient } from '@/lib/supabase/client';
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — like Discord server name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px',
          height: 56,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>⚡</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>ClawHub</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: '#fff',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          title="New Channel"
        >
          +
        </button>
      </div>

      {/* Channel list — like Discord channel list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Section header */}
        <div style={{ padding: '8px 12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5E6D93' }}>
          Agents — {channels.length}
        </div>

        {loading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#5E6D93' }}>
            Loading...
          </div>
        ) : channels.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#5E6D93' }}>
            No channels yet.<br />Click + to create one.
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

      {/* User area — like Discord user panel */}
      <div
        style={{
          padding: '12px 16px',
          background: '#070E1E',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#8E9CBC',
            fontSize: 13,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 4px',
            borderRadius: 6,
            width: '100%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8E9CBC'; }}
        >
          ← Sign Out
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
