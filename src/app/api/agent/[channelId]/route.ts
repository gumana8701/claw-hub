import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agent/[channelId]
 * 
 * DEPRECATED — this endpoint is intentionally a no-op.
 * Agent responses come from external webhook calls to /api/webhook/[channelId].
 * 
 * DO NOT add any forwarding logic here. The old version caused an echo bug
 * by forwarding user messages to the webhook URL, which inserted them as
 * agent messages.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  return NextResponse.json({ 
    ok: true, 
    channel: channelId,
    note: 'no-op — agent responses come via external webhook'
  });
}
