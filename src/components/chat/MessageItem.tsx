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

    const bulletMatch = trimmed.match(/^[•\-\*]\s+(.*)/);
    if (bulletMatch) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${bulletMatch[1]}</li>`;
      continue;
    }

    if (inList) { html += '</ul>'; inList = false; }

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
        padding: '12px 0',
      }}
    >
      {/* Avatar — 40px, like Discord */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: isAgent
            ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
            : '#1E2849',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {getInitials(senderName)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + timestamp */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#3B82F6', lineHeight: '20px' }}>
            {senderName}
          </span>
          <span style={{ fontSize: 12, fontWeight: 400, color: '#5E6D93', lineHeight: '16px' }}>
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        {/* Bubble — generous padding */}
        <div
          className="msg-body"
          style={{
            background: '#0D1526',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '18px 22px',
            color: '#D1D9E8',
            fontSize: 14,
            lineHeight: 1.7,
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}
        >
          {message.file_url && message.message_type !== 'text' && (
            <div style={{ marginBottom: 16 }}>
              <FilePreview
                fileUrl={message.file_url}
                fileName={message.file_name}
                fileSize={message.file_size}
                fileType={message.file_type}
                audioDuration={message.audio_duration}
              />
            </div>
          )}

          {message.content && (
            <div dangerouslySetInnerHTML={{ __html: parseContent(message.content) }} />
          )}
        </div>
      </div>
    </div>
  );
}
