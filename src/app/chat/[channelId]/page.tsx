'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useMessages } from '@/lib/hooks/useMessages';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import type { Channel, Message } from '@/types/database';

function getInitials(name: string): string {
  return name.split(/[\s-]+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Channel header — Discord style: 48px with channel name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
          height: 56,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          background: '#050A1A',
        }}
      >
        {channel ? (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#131B36',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#8E9CBC',
                flexShrink: 0,
              }}
            >
              {getInitials(channel.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: '20px' }}>
                {channel.name}
              </div>
              {channel.description && (
                <div style={{ fontSize: 12, color: '#5E6D93', lineHeight: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {channel.description}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: 20, width: 140, borderRadius: 6, background: '#131B36' }} />
        )}
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        currentUserId={userId}
      />

      {/* Input */}
      <MessageInput onSendText={handleSendText} onSendFile={handleSendFile} />
    </div>
  );
}
