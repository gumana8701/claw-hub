'use client';

import type { Message } from '@/types/database';
import { formatTimestamp } from '@/lib/utils';
import FilePreview from './FilePreview';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Parse message content into structured HTML */
function parseContent(text: string): string {
  // Split into lines
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect bullet lines (starting with •, -, *, or emoji bullet patterns)
    const bulletMatch = trimmed.match(/^[•\-\*]\s+(.*)/) || trimmed.match(/^[🔧📋⚡📦⚠️🏥🔮📊🔒💊⚖️⏳]\s*(.*)/);

    if (bulletMatch) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${bulletMatch[1] || bulletMatch[0].replace(/^[•\-\*🔧📋⚡📦⚠️🏥🔮📊🔒💊⚖️⏳]\s*/, '')}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (trimmed === '') {
        // Skip empty lines between paragraphs
      } else {
        // Check for section headers (emoji + label pattern like "🔧 Herramientas:")
        const headerMatch = trimmed.match(/^([🔧📋⚡📦⚠️🏥🔮📊🔒💊⚖️⏳🛠️🎤📎]\s*)?(.*?:)\s*$/);
        if (headerMatch && trimmed.endsWith(':')) {
          html += `<p><strong>${trimmed}</strong></p>`;
        } else {
          // Bold patterns **text**
          const processed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          html += `<p>${processed}</p>`;
        }
      }
    }
  }

  if (inList) html += '</ul>';
  return html;
}

export default function MessageItem({ message, isOwn }: MessageItemProps) {
  const isAgent = message.sender_type === 'agent';
  const senderName = message.profiles?.username || (isAgent ? 'Agent' : 'User');

  return (
    <div className="flex" style={{ gap: 12, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isAgent ? 'var(--gradient-brand)' : 'var(--bg-surface-raised)',
          fontSize: 12,
          fontWeight: 600,
          color: isAgent ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {getInitials(senderName)}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
        {/* Metadata */}
        <div className="flex items-baseline" style={{ gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>
            {senderName}
          </span>
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className="message-content"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            color: 'var(--text-primary)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {/* File/media preview */}
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

          {/* Text content */}
          {message.content && (
            <div dangerouslySetInnerHTML={{ __html: parseContent(message.content) }} />
          )}
        </div>
      </div>
    </div>
  );
}
