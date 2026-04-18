import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const body = await request.json();

    const supabase = createServiceClient();

    // Verify channel exists
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('id', channelId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Insert agent message
    const { data, error } = await supabase.from('messages').insert({
      channel_id: channelId,
      sender_type: 'agent',
      content: body.content || body.message || body.text || null,
      message_type: body.message_type || 'text',
      file_url: body.file_url || null,
      file_name: body.file_name || null,
      file_size: body.file_size || null,
      file_type: body.file_type || null,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
