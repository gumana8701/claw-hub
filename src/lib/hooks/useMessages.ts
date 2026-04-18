'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/database';

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();
  const PAGE_SIZE = 50;
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async (before?: string) => {
    let query = supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (!error && data) {
      const sorted = data.reverse();
      if (before) {
        setMessages((prev) => [...sorted, ...prev]);
      } else {
        setMessages(sorted);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [channelId, supabase]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setHasMore(true);
    fetchMessages();

    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(*)')
            .eq('id', (payload.new as Message).id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, fetchMessages, supabase]);

  const loadMore = useCallback(async () => {
    if (messages.length > 0 && hasMore) {
      await fetchMessages(messages[0].created_at);
    }
  }, [messages, hasMore, fetchMessages]);

  const sendMessage = async (data: Partial<Message>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      sender_id: user?.id,
      sender_type: 'user',
      ...data,
    });

    if (error) throw error;
  };

  return { messages, loading, hasMore, loadMore, sendMessage };
}
