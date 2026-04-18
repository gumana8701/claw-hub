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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0B1120' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>⚡</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>ClawHub</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            width: 30,
            height: 30,
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

      {/* Section label */}
      <div style={{ padding: '16px 18px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B5B80' }}>
        Agents — {channels.length}
      </div>

      {/* Channel list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 10px 16px',
        }}
      >
        {loading ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: '#4B5B80' }}>
            Loading...
          </div>
        ) : channels.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: '#4B5B80', lineHeight: 1.6 }}>
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

      {/* Footer */}
      <div
        style={{
          padding: '14px 18px',
          background: '#070D1A',
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
            color: '#6B7BA0',
            fontSize: 13,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 4px',
            borderRadius: 6,
            width: '100%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#CBD5E1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7BA0'; }}
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
