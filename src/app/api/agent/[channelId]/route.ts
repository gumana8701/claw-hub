import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agent/[channelId]
 * Called by the frontend when a user sends a message.
 * This is a no-op stub for now — actual agent responses come from
 * the OpenClaw bridge (cron job) that polls for new messages and
 * posts responses via /api/webhook/[channelId].
 * 
 * We keep this endpoint so the frontend doesn't get 404 errors.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  
  // Just acknowledge — the bridge handles actual agent responses
  return NextResponse.json({ 
    success: true, 
    mode: 'async',
    message: 'Message received. Agent will respond via bridge.' 
  });
}
