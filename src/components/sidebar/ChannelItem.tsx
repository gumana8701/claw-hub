'use client';

import Link from 'next/link';
import type { Channel } from '@/types/database';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  return (
    <Link
      href={`/chat/${channel.id}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        textDecoration: 'none',
        background: isActive
          ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
          : 'transparent',
        boxShadow: isActive ? '0 0 24px rgba(124, 58, 237, 0.25)' : 'none',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = '#1E2849';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar — Discord style: square with rounded corners */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: isActive ? 'rgba(255,255,255,0.15)' : '#131B36',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: isActive ? '#fff' : '#8E9CBC',
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}
      >
        {getInitials(channel.name)}
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: isActive ? '#fff' : '#e2e8f0',
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
              color: isActive ? 'rgba(255,255,255,0.7)' : '#5E6D93',
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
