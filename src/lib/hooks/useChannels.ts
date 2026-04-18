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
      .order('name', { ascending: true });

    if (!error && data) {
      // Sort by leading number if present (e.g. "1 · Axis" before "2 · Privado")
      const sorted = data.sort((a, b) => {
        const numA = parseInt(a.name.match(/^(\d+)/)?.[1] || '999');
        const numB = parseInt(b.name.match(/^(\d+)/)?.[1] || '999');
        return numA - numB;
      });
      setChannels(sorted);
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
        () => { fetchChannels(); }
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
