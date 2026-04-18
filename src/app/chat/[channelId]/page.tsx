'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useMessages } from '@/lib/hooks/useMessages';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import type { Channel, Message } from '@/types/database';

function getInitials(name: string): string {
  const clean = name.replace(/^\d+\s*[·\-]\s*/, '');
  return clean.split(/[\s-]+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.channelId as string;
  const supabase = createClient();
  const { messages, loading, hasMore, loadMore, sendMessage, pendingCount, agentThinking, agentOffline } = useMessages(channelId);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: ch }, { data: { user } }] = await Promise.all([
        supabase.from('channels').select('*').eq('id', channelId).single(),
        supabase.auth.getUser(),
      ]);
      setChannel(ch);
      setUserId(user?.id || null);
    };
    fetchData();
  }, [channelId, supabase]);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/archive/${channelId}`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        // Download the archive as JSON
        const jsonBlob = new Blob([JSON.stringify(data.archive, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const a1 = document.createElement('a');
        a1.href = jsonUrl;
        a1.download = `archive-${channel?.name?.replace(/[^a-zA-Z0-9]/g, '-') || channelId}.json`;
        a1.click();
        URL.revokeObjectURL(jsonUrl);

        // Download transcript
        const txtBlob = new Blob([data.transcript], { type: 'text/plain' });
        const txtUrl = URL.createObjectURL(txtBlob);
        const a2 = document.createElement('a');
        a2.href = txtUrl;
        a2.download = `transcript-${channel?.name?.replace(/[^a-zA-Z0-9]/g, '-') || channelId}.txt`;
        a2.click();
        URL.revokeObjectURL(txtUrl);

        // Navigate to chat home
        router.push('/chat');
      }
    } catch (err) {
      console.error('Archive failed:', err);
    } finally {
      setArchiving(false);
      setShowArchiveConfirm(false);
    }
  };

  const handleSendText = async (content: string) => {
    await sendMessage({ content, message_type: 'text' });
  };

  const handleSendFile = async (data: {
    content?: string;
    message_type: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    audio_duration?: number;
  }) => {
    await sendMessage(data as Partial<Message>);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Channel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
          height: 56,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          background: '#050A1A',
        }}
      >
        {channel ? (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#131B36',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#8E9CBC',
                flexShrink: 0,
              }}
            >
              {getInitials(channel.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: '20px' }}>
                {channel.name}
              </div>
              {channel.description && (
                <div style={{ fontSize: 12, color: '#5E6D93', lineHeight: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {channel.description}
                </div>
              )}
            </div>

            {/* Status badge */}
            {agentThinking && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'rgba(59,130,246,0.1)',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', animation: 'headerPulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6' }}>
                  Pensando{pendingCount > 1 ? ` · ${pendingCount} en cola` : ''}
                </span>
              </div>
            )}
            {agentOffline && !agentThinking && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'rgba(245,158,11,0.1)',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B' }}>Offline</span>
              </div>
            )}

            {/* Archive button */}
            <button
              onClick={() => setShowArchiveConfirm(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: '#4B5B80',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1E2849'; e.currentTarget.style.color = '#8E9CBC'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4B5B80'; }}
              title="Archivar canal"
            >
              📦
            </button>
          </>
        ) : (
          <div style={{ height: 20, width: 140, borderRadius: 6, background: '#131B36' }} />
        )}
      </div>

      {/* Archive confirmation modal */}
      {showArchiveConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(5,10,26,0.85)' }}
          onClick={() => setShowArchiveConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              borderRadius: 14,
              padding: 28,
              background: '#0D1526',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              📦 Archivar Canal
            </div>
            <p style={{ fontSize: 14, color: '#8E9CBC', lineHeight: 1.6, marginBottom: 8 }}>
              Se descargará un archivo con <strong style={{ color: '#fff' }}>toda la conversación</strong> (mensajes, archivos, datos del agente).
            </p>
            <p style={{ fontSize: 14, color: '#8E9CBC', lineHeight: 1.6, marginBottom: 24 }}>
              El canal desaparecerá del sidebar y los demás se renumerarán automáticamente. Puedes restaurarlo después.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  background: '#1E2849',
                  color: '#8E9CBC',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  background: archiving ? '#1E2849' : '#F59E0B',
                  color: archiving ? '#5E6D93' : '#000',
                  border: 'none',
                  cursor: archiving ? 'not-allowed' : 'pointer',
                }}
              >
                {archiving ? 'Archivando...' : 'Archivar y Descargar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        currentUserId={userId}
        agentThinking={agentThinking}
        agentOffline={agentOffline}
        pendingCount={pendingCount}
      />

      {/* Input */}
      <MessageInput onSendText={handleSendText} onSendFile={handleSendFile} />

      <style>{`
        @keyframes headerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
