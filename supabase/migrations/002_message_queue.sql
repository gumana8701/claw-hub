-- Migration: Add message queue/status support
-- Run in Supabase SQL Editor

-- Add status column to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent' CHECK (status IN ('sent', 'queued', 'processing', 'done', 'error'));

-- Add agent_thinking flag (true while agent is generating response)
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS agent_status text DEFAULT 'idle' CHECK (agent_status IN ('idle', 'thinking', 'error'));

ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS agent_status_updated_at timestamptz DEFAULT now();

-- Index for quick queue lookups
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(channel_id, status) WHERE status IN ('queued', 'processing');

-- Enable realtime for channels updates (agent_status changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
