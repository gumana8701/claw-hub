'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/database';

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [agentThinking, setAgentThinking] = useState(false);
  const supabase = createClient();
  const PAGE_SIZE = 50;
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingIdsRef = useRef<Set<string>>(new Set());

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

  // Detect agent thinking: when last message is from user, agent is likely thinking
  const updateThinkingState = useCallback((msgs: Message[]) => {
    if (msgs.length === 0) {
      setAgentThinking(false);
      return;
    }
    const last = msgs[msgs.length - 1];
    const isThinking = last.sender_type === 'user' && pendingIdsRef.current.size > 0;
    setAgentThinking(isThinking);
  }, []);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setHasMore(true);
    pendingIdsRef.current.clear();
    setPendingCount(0);
    setAgentThinking(false);
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
          const newMsg = payload.new as Message;

          // If agent responded, clear all pending
          if (newMsg.sender_type === 'agent') {
            pendingIdsRef.current.clear();
            setPendingCount(0);
            setAgentThinking(false);
          }

          const { data } = await supabase
            .from('messages')
            .select('*, profiles(*)')
            .eq('id', newMsg.id)
            .single();

          if (data) {
            setMessages((prev) => {
              const updated = [...prev, data];
              updateThinkingState(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, fetchMessages, supabase, updateThinkingState]);

  const loadMore = useCallback(async () => {
    if (messages.length > 0 && hasMore) {
      await fetchMessages(messages[0].created_at);
    }
  }, [messages, hasMore, fetchMessages]);

  const sendMessage = async (data: Partial<Message>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Track as pending
    const tempId = `pending-${Date.now()}`;
    pendingIdsRef.current.add(tempId);
    setPendingCount(pendingIdsRef.current.size);
    setAgentThinking(true);

    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      sender_id: user?.id,
      sender_type: 'user',
      ...data,
    });

    if (error) {
      pendingIdsRef.current.delete(tempId);
      setPendingCount(pendingIdsRef.current.size);
      throw error;
    }
  };

  return { messages, loading, hasMore, loadMore, sendMessage, pendingCount, agentThinking };
}
