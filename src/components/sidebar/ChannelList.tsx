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
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">⚡ ClawHub</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}
          title="New Channel"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {loading ? (
          <div className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading...
          </div>
        ) : channels.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
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

      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
