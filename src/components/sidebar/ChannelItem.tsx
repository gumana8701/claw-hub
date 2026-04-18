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
      className="flex items-center gap-3 cursor-pointer transition-all"
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: isActive ? 'var(--gradient-brand)' : 'transparent',
        boxShadow: isActive ? 'var(--shadow-glow-violet)' : 'none',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface-raised)',
          fontSize: 13,
          fontWeight: 600,
          color: isActive ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {getInitials(channel.name)}
      </div>

      {/* Text */}
      <div className="flex flex-col flex-1" style={{ minWidth: 0, gap: 2 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: isActive ? '#fff' : 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {channel.name}
        </span>
        {channel.agent_name && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: isActive ? 'rgba(255,255,255,0.75)' : 'var(--text-tertiary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {channel.agent_name}
          </span>
        )}
      </div>
    </Link>
  );
}
