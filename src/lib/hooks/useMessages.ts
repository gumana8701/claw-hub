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
  const [agentOffline, setAgentOffline] = useState(false);
  const supabase = createClient();
  const PAGE_SIZE = 50;
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearThinkingTimeout = useCallback(() => {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
  }, []);

  const startThinkingTimeout = useCallback(() => {
    clearThinkingTimeout();
    thinkingTimeoutRef.current = setTimeout(() => {
      // After 30s with no response, mark agent as offline
      setAgentThinking(false);
      setAgentOffline(true);
      pendingIdsRef.current.clear();
      setPendingCount(0);
    }, 30000);
  }, [clearThinkingTimeout]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setHasMore(true);
    pendingIdsRef.current.clear();
    setPendingCount(0);
    setAgentThinking(false);
    setAgentOffline(false);
    clearThinkingTimeout();
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

          // If agent responded, clear all pending + timeout
          if (newMsg.sender_type === 'agent') {
            pendingIdsRef.current.clear();
            setPendingCount(0);
            setAgentThinking(false);
            setAgentOffline(false);
            clearThinkingTimeout();
          }

          const { data } = await supabase
            .from('messages')
            .select('*, profiles(*)')
            .eq('id', newMsg.id)
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
      clearThinkingTimeout();
    };
  }, [channelId, fetchMessages, supabase, clearThinkingTimeout]);

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
    setAgentOffline(false);
    startThinkingTimeout();

    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      sender_id: user?.id,
      sender_type: 'user',
      ...data,
    });

    if (error) {
      pendingIdsRef.current.delete(tempId);
      setPendingCount(pendingIdsRef.current.size);
      if (pendingIdsRef.current.size === 0) {
        setAgentThinking(false);
        clearThinkingTimeout();
      }
      throw error;
    }
  };

  return { messages, loading, hasMore, loadMore, sendMessage, pendingCount, agentThinking, agentOffline };
}
