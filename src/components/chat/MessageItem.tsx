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

/** Check if content is raw JSON (garbage from bridge) */
function isJsonGarbage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"id"')) return true;
  if (trimmed.startsWith('[') && trimmed.includes('"id"')) return true;
  return false;
}

/** Parse message content into structured HTML */
function parseContent(text: string): string {
  if (isJsonGarbage(text)) return '<p style="color:#5E6D93;font-style:italic">[mensaje del sistema]</p>';
  
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
  const senderName = message.profiles?.username || (isAgent ? 'Agent' : 'Guillermo');

  // Skip messages that are just raw JSON with no useful content
  if (message.content && isJsonGarbage(message.content) && !message.file_url) {
    return null; // Don't render at all
  }

  // For audio/file messages with no text content, just show the file
  const hasFile = message.file_url && message.message_type !== 'text';
  const hasText = message.content && message.content.trim() && !isJsonGarbage(message.content);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 0' }}>
      {/* Avatar */}
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
          <span style={{ fontSize: 15, fontWeight: 600, color: isAgent ? '#3B82F6' : '#22C55E', lineHeight: '20px' }}>
            {senderName}
          </span>
          <span style={{ fontSize: 12, fontWeight: 400, color: '#5E6D93', lineHeight: '16px' }}>
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        {/* Content area - only render bubble if there's something to show */}
        {(hasFile || hasText) && (
          <div
            className="msg-body"
            style={{
              background: '#0D1526',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: hasFile && !hasText ? '12px 14px' : '18px 22px',
              color: '#D1D9E8',
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {hasFile && (
              <div style={{ marginBottom: hasText ? 16 : 0 }}>
                <FilePreview
                  fileUrl={message.file_url!}
                  fileName={message.file_name}
                  fileSize={message.file_size}
                  fileType={message.file_type}
                  audioDuration={message.audio_duration}
                />
              </div>
            )}

            {hasText && (
              <div dangerouslySetInnerHTML={{ __html: parseContent(message.content!) }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
