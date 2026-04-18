'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useMessages } from '@/lib/hooks/useMessages';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import type { Channel, Message } from '@/types/database';

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const supabase = createClient();
  const { messages, loading, hasMore, loadMore, sendMessage } = useMessages(channelId);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: ch }, { data: { user } }] = await Promise.all([
        supabase.from('channels').select('*').eq('id', channelId).single(),
        supabase.auth.getUser(),
      ]);
      setChannel(ch);
      setUserId(user?.id || null);
    };
    fetchData();
  }, [channelId, supabase]);

  const handleSendText = async (content: string) => {
    await sendMessage({ content, message_type: 'text' });
  };

  const handleSendFile = async (data: {
    content?: string;
    message_type: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    audio_duration?: number;
  }) => {
    await sendMessage(data as Partial<Message>);
  };

  return (
    <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
      {/* Chat header */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 64,
          padding: '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 12,
        }}
      >
        {channel ? (
          <>
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-raised)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              {getInitials(channel.name)}
            </div>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {channel.name}
              </span>
              {channel.description && (
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>
                  {channel.description}
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: 20, width: 128, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)' }} />
        )}
      </div>

      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        currentUserId={userId}
      />

      <MessageInput onSendText={handleSendText} onSendFile={handleSendFile} />
    </div>
  );
}
