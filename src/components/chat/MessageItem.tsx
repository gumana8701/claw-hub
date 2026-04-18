'use client';

import type { Message } from '@/types/database';
import { formatTimestamp } from '@/lib/utils';
import FilePreview from './FilePreview';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageItem({ message, isOwn }: MessageItemProps) {
  const isAgent = message.sender_type === 'agent';
  const senderName = isAgent
    ? (message.profiles?.username || 'Agent')
    : (message.profiles?.username || 'User');

  return (
    <div className={`flex gap-3 px-4 py-1.5 group hover:opacity-95 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{
          background: isAgent ? 'var(--accent)' : 'var(--bg-hover)',
          color: isAgent ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {isAgent ? '🤖' : senderName[0]?.toUpperCase()}
      </div>

      {/* Content */}
      <div className={`max-w-[75%] min-w-0 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: isAgent ? 'var(--accent)' : 'var(--text-primary)' }}>
            {senderName}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words"
          style={{
            background: isAgent ? 'var(--agent-bg)' : isOwn ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: isOwn && !isAgent ? '#fff' : 'var(--text-primary)',
            borderTopLeftRadius: !isOwn ? '4px' : undefined,
            borderTopRightRadius: isOwn ? '4px' : undefined,
          }}
        >
          {/* File/media preview */}
          {message.file_url && message.message_type !== 'text' && (
            <div className="mb-2">
              <FilePreview
                fileUrl={message.file_url}
                fileName={message.file_name}
                fileSize={message.file_size}
                fileType={message.file_type}
                audioDuration={message.audio_duration}
              />
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
