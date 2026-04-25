import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAgentPrompt } from '@/lib/agents/config';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const supabase = createServiceClient();

  try {
    // Get channel info
    const { data: channel } = await supabase
      .from('channels')
      .select('id, name, agent_name')
      .eq('id', channelId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Update status to thinking
    await supabase
      .from('channels')
      .update({
        agent_status: 'thinking',
        agent_status_updated_at: new Date().toISOString(),
      })
      .eq('id', channelId);

    // Fetch recent messages for context (last 20)
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_type, content, message_type, created_at')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Build conversation history — Claude requires alternating user/assistant
    const rawHistory = (messages || [])
      .reverse()
      .filter((m) => m.content && m.message_type === 'text')
      .map((m) => ({
        role: m.sender_type === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content!,
      }));

    // Merge consecutive same-role messages
    const history: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const msg of rawHistory) {
      const last = history[history.length - 1];
      if (last && last.role === msg.role) {
        last.content += '\n' + msg.content;
      } else {
        history.push({ ...msg });
      }
    }

    // Ensure starts with user
    if (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    if (history.length === 0) {
      await supabase
        .from('channels')
        .update({ agent_status: 'idle', agent_status_updated_at: new Date().toISOString() })
        .eq('id', channelId);
      return NextResponse.json({ ok: true, note: 'no messages to respond to' });
    }

    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: getAgentPrompt(channel.agent_name),
      messages: history,
    });

    const agentReply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    if (!agentReply) {
      await supabase
        .from('channels')
        .update({ agent_status: 'idle', agent_status_updated_at: new Date().toISOString() })
        .eq('id', channelId);
      return NextResponse.json({ ok: true, note: 'empty response' });
    }

    // Insert agent response
    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        sender_type: 'agent',
        content: agentReply,
        message_type: 'text',
      })
      .select()
      .single();

    // Update status to idle
    await supabase
      .from('channels')
      .update({ agent_status: 'idle', agent_status_updated_at: new Date().toISOString() })
      .eq('id', channelId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (err: unknown) {
    console.error('Agent error:', err);
    try {
      await supabase
        .from('channels')
        .update({ agent_status: 'error', agent_status_updated_at: new Date().toISOString() })
        .eq('id', channelId);
    } catch {
      /* ignore */
    }
    const message = err instanceof Error ? err.message : 'Agent error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
