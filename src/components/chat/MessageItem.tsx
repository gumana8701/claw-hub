'use client';

import type { Message } from '@/types/database';
import { formatTimestamp } from '@/lib/utils';
import FilePreview from './FilePreview';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

function getInitials(name: string): string {
  return name.split(/[\s-]+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

/** Parse message content into structured HTML */
function parseContent(text: string): string {
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }

    // Bullet lines
    const bulletMatch = trimmed.match(/^[•\-\*]\s+(.*)/);
    if (bulletMatch) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${bulletMatch[1]}</li>`;
      continue;
    }

    if (inList) { html += '</ul>'; inList = false; }

    // Section header (ends with :)
    if (trimmed.endsWith(':') && trimmed.length < 60) {
      html += `<p><strong>${trimmed}</strong></p>`;
    } else {
      const processed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += `<p>${processed}</p>`;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

export default function MessageItem({ message, isOwn }: MessageItemProps) {
  const isAgent = message.sender_type === 'agent';
  const senderName = message.profiles?.username || (isAgent ? 'Agent' : 'User');

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        padding: '8px 0',
      }}
    >
      {/* Avatar — Discord style: 40px circle */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: isAgent
            ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
            : '#131B36',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: isAgent ? '#fff' : '#8E9CBC',
          flexShrink: 0,
        }}
      >
        {getInitials(senderName)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + timestamp — Discord style */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6', lineHeight: '20px' }}>
            {senderName}
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#5E6D93', lineHeight: '16px' }}>
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className="msg-body"
          style={{
            background: '#0A1122',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '14px 18px',
            color: '#e2e8f0',
            fontSize: 14,
            lineHeight: 1.65,
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}
        >
          {/* File/media */}
          {message.file_url && message.message_type !== 'text' && (
            <div style={{ marginBottom: 12 }}>
              <FilePreview
                fileUrl={message.file_url}
                fileName={message.file_name}
                fileSize={message.file_size}
                fileType={message.file_type}
                audioDuration={message.audio_duration}
              />
            </div>
          )}

          {/* Text */}
          {message.content && (
            <div dangerouslySetInnerHTML={{ __html: parseContent(message.content) }} />
          )}
        </div>
      </div>
    </div>
  );
}
