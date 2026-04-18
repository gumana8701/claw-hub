'use client';

import Link from 'next/link';
import type { Channel } from '@/types/database';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick?: () => void;
}

function getInitials(name: string): string {
  // Remove leading number + separator (e.g. "1 · " or "10 · ")
  const clean = name.replace(/^\d+\s*[·\-]\s*/, '');
  return clean
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Stable color based on channel name
function getAvatarColor(name: string): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#22C55E', '#06B6D4', '#6366F1', '#F97316', '#14B8A6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  const initials = getInitials(channel.name);
  const color = getAvatarColor(channel.name);

  return (
    <Link
      href={`/chat/${channel.id}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        marginBottom: 4,
        borderRadius: 10,
        cursor: 'pointer',
        textDecoration: 'none',
        background: isActive
          ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
          : 'transparent',
        boxShadow: isActive ? '0 0 20px rgba(124, 58, 237, 0.2)' : 'none',
        transition: 'background 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: isActive ? 'rgba(255,255,255,0.2)' : color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}
      >
        {initials}
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? '#fff' : '#CBD5E1',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '20px',
          }}
        >
          {channel.name}
        </div>
        {channel.agent_name && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: isActive ? 'rgba(255,255,255,0.65)' : '#4B5B80',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '16px',
            }}
          >
            {channel.agent_name}
          </div>
        )}
      </div>
    </Link>
  );
}
