import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/bridge?agent_name=xxx&since=ISO_DATE
 * Polling endpoint for OpenClaw agents to check for new messages.
 * Each agent polls its channel for unprocessed user messages.
 * 
 * POST /api/bridge
 * Agent posts a response to a specific channel.
 * Body: { channel_id, content, message_type? }
 */

export async function GET(request: NextRequest) {
  const agentName = request.nextUrl.searchParams.get('agent_name');
  const since = request.nextUrl.searchParams.get('since') || new Date(Date.now() - 300000).toISOString(); // default last 5 min

  if (!agentName) {
    return NextResponse.json({ error: 'agent_name required' }, { status: 400 });
  }

  // Verify with API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.BRIDGE_API_KEY && process.env.BRIDGE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find channel for this agent
  const { data: channel } = await supabase
    .from('channels')
    .select('id, name')
    .eq('agent_name', agentName)
    .eq('archived', false)
    .single();

  if (!channel) {
    return NextResponse.json({ error: `No channel for agent: ${agentName}` }, { status: 404 });
  }

  // Get unprocessed user messages since last check
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, message_type, file_url, file_name, created_at')
    .eq('channel_id', channel.id)
    .eq('sender_type', 'user')
    .gt('created_at', since)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    channel_id: channel.id,
    channel_name: channel.name,
    messages: messages || [],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verify with API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.BRIDGE_API_KEY && process.env.BRIDGE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { channel_id, content, message_type } = body;

  if (!channel_id || !content) {
    return NextResponse.json({ error: 'channel_id and content required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Insert agent response
  const { data, error } = await supabase.from('messages').insert({
    channel_id,
    sender_type: 'agent',
    content,
    message_type: message_type || 'text',
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update channel status to idle
  await supabase
    .from('channels')
    .update({ agent_status: 'idle', agent_status_updated_at: new Date().toISOString() })
    .eq('id', channel_id);

  return NextResponse.json({ success: true, message: data });
}
