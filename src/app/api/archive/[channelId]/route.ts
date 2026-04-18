import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;

  try {
    // 1. Get channel info
    const { data: channel, error: chErr } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // 2. Get ALL messages with profiles
    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // 3. Build the archive data
    const archiveData = {
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        agent_name: channel.agent_name,
        created_at: channel.created_at,
        archived_at: new Date().toISOString(),
      },
      messages: (messages || []).map((m: Record<string, unknown>) => ({
        id: m.id,
        sender_type: m.sender_type,
        sender_name: (m.profiles as Record<string, unknown>)?.username || (m.sender_type === 'agent' ? 'Agent' : 'User'),
        content: m.content,
        message_type: m.message_type,
        file_url: m.file_url,
        file_name: m.file_name,
        file_size: m.file_size,
        file_type: m.file_type,
        audio_duration: m.audio_duration,
        created_at: m.created_at,
      })),
      stats: {
        total_messages: messages?.length || 0,
        user_messages: messages?.filter((m: Record<string, unknown>) => m.sender_type === 'user').length || 0,
        agent_messages: messages?.filter((m: Record<string, unknown>) => m.sender_type === 'agent').length || 0,
        files: messages?.filter((m: Record<string, unknown>) => m.file_url).length || 0,
        date_range: {
          first: messages?.[0]?.created_at || null,
          last: messages?.[messages.length - 1]?.created_at || null,
        },
      },
    };

    // 4. Generate a text transcript too
    let transcript = `=== ARCHIVE: ${channel.name} ===\n`;
    transcript += `Agent: ${channel.agent_name || 'N/A'}\n`;
    transcript += `Description: ${channel.description || 'N/A'}\n`;
    transcript += `Archived: ${archiveData.channel.archived_at}\n`;
    transcript += `Total messages: ${archiveData.stats.total_messages}\n`;
    transcript += `\n${'='.repeat(60)}\n\n`;

    for (const msg of archiveData.messages) {
      const time = new Date(msg.created_at).toLocaleString('es-MX', { timeZone: 'UTC' });
      const sender = msg.sender_name;
      transcript += `[${time}] ${sender}:\n`;
      if (msg.content) transcript += `${msg.content}\n`;
      if (msg.file_url) transcript += `📎 ${msg.file_name} (${msg.file_url})\n`;
      transcript += `\n`;
    }

    // 5. Create ZIP using a simple approach (no external deps)
    // We'll return JSON + transcript as separate downloadable content
    // The client will package them

    // 6. Mark channel as archived
    await supabase
      .from('channels')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', channelId);

    // 7. Renumber remaining active channels
    const { data: activeChannels } = await supabase
      .from('channels')
      .select('id, name')
      .eq('archived', false)
      .order('name', { ascending: true });

    if (activeChannels) {
      // Sort by current number
      const sorted = activeChannels.sort((a, b) => {
        const numA = parseInt(a.name.match(/^(\d+)/)?.[1] || '999');
        const numB = parseInt(b.name.match(/^(\d+)/)?.[1] || '999');
        return numA - numB;
      });

      // Renumber
      for (let i = 0; i < sorted.length; i++) {
        const ch = sorted[i];
        const oldName = ch.name;
        const baseName = oldName.replace(/^\d+\s*[·\-]\s*/, '');
        const newName = `${i + 1} · ${baseName}`;
        if (newName !== oldName) {
          await supabase
            .from('channels')
            .update({ name: newName, sort_order: i + 1 })
            .eq('id', ch.id);
        } else {
          await supabase
            .from('channels')
            .update({ sort_order: i + 1 })
            .eq('id', ch.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      archive: archiveData,
      transcript,
    });
  } catch (err) {
    console.error('Archive error:', err);
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 });
  }
}

// Unarchive endpoint
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;

  try {
    // Unarchive the channel
    await supabase
      .from('channels')
      .update({ archived: false, archived_at: null })
      .eq('id', channelId);

    // Renumber all active channels
    const { data: activeChannels } = await supabase
      .from('channels')
      .select('id, name')
      .eq('archived', false)
      .order('name', { ascending: true });

    if (activeChannels) {
      const sorted = activeChannels.sort((a, b) => {
        const numA = parseInt(a.name.match(/^(\d+)/)?.[1] || '999');
        const numB = parseInt(b.name.match(/^(\d+)/)?.[1] || '999');
        return numA - numB;
      });

      for (let i = 0; i < sorted.length; i++) {
        const ch = sorted[i];
        const baseName = ch.name.replace(/^\d+\s*[·\-]\s*/, '');
        const newName = `${i + 1} · ${baseName}`;
        await supabase
          .from('channels')
          .update({ name: newName, sort_order: i + 1 })
          .eq('id', ch.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unarchive error:', err);
    return NextResponse.json({ error: 'Unarchive failed' }, { status: 500 });
  }
}
