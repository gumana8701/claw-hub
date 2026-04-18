import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/agent/[channelId]
 * Called by the frontend when a user sends a message.
 * Forwards the message to the agent's webhook URL so it can process and respond.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    // Get channel with webhook URL
    const { data: channel } = await supabase
      .from('channels')
      .select('id, name, agent_name, agent_webhook_url')
      .eq('id', channelId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (!channel.agent_webhook_url) {
      return NextResponse.json({ error: 'No agent webhook configured for this channel' }, { status: 400 });
    }

    // Update channel status to thinking
    await supabase
      .from('channels')
      .update({ agent_status: 'thinking', agent_status_updated_at: new Date().toISOString() })
      .eq('id', channelId);

    // Get recent messages for context (last 20)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('sender_type, content, message_type, file_url, file_name, created_at')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Forward to agent webhook
    const payload = {
      channel_id: channelId,
      channel_name: channel.name,
      agent_name: channel.agent_name,
      message: body.content || body.message || '',
      message_type: body.message_type || 'text',
      file_url: body.file_url || null,
      file_name: body.file_name || null,
      // Callback URL for the agent to post its response
      callback_url: `${request.nextUrl.origin}/api/webhook/${channelId}`,
      // Recent conversation context
      history: (recentMessages || []).reverse().map((m) => ({
        role: m.sender_type === 'agent' ? 'assistant' : 'user',
        content: m.content || (m.file_url ? `[File: ${m.file_name}]` : ''),
        timestamp: m.created_at,
      })),
    };

    try {
      const agentRes = await fetch(channel.agent_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(55000), // 55s timeout (Vercel limit ~60s)
      });

      if (agentRes.ok) {
        const agentData = await agentRes.json().catch(() => null);

        // If agent returned a response directly (sync mode), insert it
        if (agentData?.content || agentData?.message || agentData?.text) {
          await supabase.from('messages').insert({
            channel_id: channelId,
            sender_type: 'agent',
            content: agentData.content || agentData.message || agentData.text,
            message_type: 'text',
          });
        }

        // Update status back to idle
        await supabase
          .from('channels')
          .update({ agent_status: 'idle', agent_status_updated_at: new Date().toISOString() })
          .eq('id', channelId);

        return NextResponse.json({ success: true, mode: agentData?.content ? 'sync' : 'async' });
      } else {
        // Agent webhook failed
        await supabase
          .from('channels')
          .update({ agent_status: 'error', agent_status_updated_at: new Date().toISOString() })
          .eq('id', channelId);

        return NextResponse.json({ error: `Agent returned ${agentRes.status}` }, { status: 502 });
      }
    } catch (fetchErr) {
      // Timeout or network error
      await supabase
        .from('channels')
        .update({ agent_status: 'error', agent_status_updated_at: new Date().toISOString() })
        .eq('id', channelId);

      return NextResponse.json({ error: 'Agent unreachable' }, { status: 504 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
