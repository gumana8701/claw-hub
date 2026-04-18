'use client';

import Link from 'next/link';
import type { Channel } from '@/types/database';
import { cn } from '@/lib/utils';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick?: () => void;
}

export default function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  return (
    <Link
      href={`/chat/${channel.id}`}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
        isActive ? 'font-semibold' : 'hover:opacity-90'
      )}
      style={{
        background: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? '#fff' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span className="text-lg flex-shrink-0">{channel.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate">{channel.name}</p>
        {channel.agent_name && (
          <p className="text-xs truncate opacity-60">{channel.agent_name}</p>
        )}
      </div>
    </Link>
  );
}
