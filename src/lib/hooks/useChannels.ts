'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Channel } from '@/types/database';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchChannels = useCallback(async () => {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setChannels(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchChannels();

    const channel = supabase
      .channel('channels-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channels' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChannels((prev) => [...prev, payload.new as Channel]);
          } else if (payload.eventType === 'UPDATE') {
            setChannels((prev) =>
              prev.map((ch) => (ch.id === (payload.new as Channel).id ? (payload.new as Channel) : ch))
            );
          } else if (payload.eventType === 'DELETE') {
            setChannels((prev) => prev.filter((ch) => ch.id !== (payload.old as Channel).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChannels, supabase]);

  const createChannel = async (data: {
    name: string;
    description?: string;
    agent_webhook_url?: string;
    agent_name?: string;
    icon?: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: newChannel, error } = await supabase
      .from('channels')
      .insert({ ...data, created_by: user?.id })
      .select()
      .single();

    if (error) throw error;
    return newChannel;
  };

  return { channels, loading, createChannel, refetch: fetchChannels };
}
