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
      setAgentThinking(false);
      setAgentOffline(true);
      pendingIdsRef.current.clear();
      setPendingCount(0);
    }, 60000); // 60s timeout (agent webhook has 55s)
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

    // Insert message into DB
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

    // Fire-and-forget: call agent webhook via our API
    fetch(`/api/agent/${channelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: data.content,
        message_type: data.message_type,
        file_url: data.file_url,
        file_name: data.file_name,
      }),
    }).catch((err) => {
      console.error('Agent call failed:', err);
      // Don't throw — message is already saved, agent will process when available
    });
  };

  return { messages, loading, hasMore, loadMore, sendMessage, pendingCount, agentThinking, agentOffline };
}
