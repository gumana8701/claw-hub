'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChannels } from '@/lib/hooks/useChannels';
import { createClient } from '@/lib/supabase/client';
import ChannelItem from './ChannelItem';
import CreateChannelModal from './CreateChannelModal';

interface ChannelListProps {
  onChannelSelect?: () => void;
}

export default function ChannelList({ onChannelSelect }: ChannelListProps) {
  const { channels, loading, createChannel } = useChannels();
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const activeId = params?.channelId as string | undefined;

  const activeChannels = channels.filter((ch) => !(ch as Record<string, unknown>).archived);
  const archivedChannels = channels.filter((ch) => (ch as Record<string, unknown>).archived);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleUnarchive = async (channelId: string) => {
    try {
      await fetch(`/api/archive/${channelId}`, { method: 'DELETE' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0B1120' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>⚡</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>ClawHub</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: '#fff',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          title="New Channel"
        >
          +
        </button>
      </div>

      {/* Section label */}
      <div style={{ padding: '16px 18px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B5B80' }}>
        Agentes — {activeChannels.length}
      </div>

      {/* Active channels */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 10px 16px',
        }}
      >
        {loading ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: '#4B5B80' }}>
            Loading...
          </div>
        ) : activeChannels.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: '#4B5B80', lineHeight: 1.6 }}>
            No hay canales activos.<br />Click + para crear uno.
          </div>
        ) : (
          activeChannels.map((ch) => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              isActive={activeId === ch.id}
              onClick={onChannelSelect}
            />
          ))
        )}

        {/* Archived section */}
        {archivedChannels.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setShowArchived(!showArchived)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#4B5B80',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <span style={{ transform: showArchived ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms', display: 'inline-block' }}>▶</span>
              Archivados — {archivedChannels.length}
            </button>

            {showArchived && archivedChannels.map((ch) => (
              <div
                key={ch.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  marginBottom: 2,
                  borderRadius: 8,
                  opacity: 0.5,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#131B36',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#4B5B80',
                  }}
                >
                  📦
                </div>
                <div style={{ flex: 1, fontSize: 13, color: '#5E6D93' }}>
                  {ch.name}
                </div>
                <button
                  onClick={() => handleUnarchive(ch.id)}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#1E2849',
                    color: '#8E9CBC',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 18px',
          background: '#070D1A',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#6B7BA0',
            fontSize: 13,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 4px',
            borderRadius: 6,
            width: '100%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#CBD5E1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7BA0'; }}
        >
          ← Sign Out
        </button>
      </div>

      <CreateChannelModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (data) => { await createChannel(data); }}
      />
    </div>
  );
}
