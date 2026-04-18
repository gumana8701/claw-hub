'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useMessages } from '@/lib/hooks/useMessages';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import type { Channel } from '@/types/database';

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
    await sendMessage(data as Partial<import('@/types/database').Message>);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Channel header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {channel ? (
          <>
            <span className="text-lg">{channel.icon}</span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{channel.name}</h2>
              {channel.description && (
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {channel.description}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="h-5 w-32 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
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
