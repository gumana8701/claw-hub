'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '@/types/database';
import MessageItem from './MessageItem';
import ThinkingIndicator from './ThinkingIndicator';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId: string | null;
  agentThinking?: boolean;
  pendingCount?: number;
}

export default function MessageList({ messages, loading, hasMore, onLoadMore, currentUserId, agentThinking, pendingCount }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevMessageCount = useRef(messages.length);

  useEffect(() => {
    if (autoScroll && messages.length > prevMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, autoScroll]);

  // Also scroll when thinking state changes
  useEffect(() => {
    if (autoScroll && agentThinking) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentThinking, autoScroll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [loading]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasMore && !loading) onLoadMore();
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 0',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px', width: '100%' }}>
        {loading && messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <p style={{ fontSize: 14, color: '#5E6D93' }}>Cargando mensajes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
              <p style={{ fontSize: 15, color: '#5E6D93', lineHeight: 1.6 }}>
                Sin mensajes aún.<br />¡Empieza la conversación!
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <button
                  onClick={onLoadMore}
                  style={{
                    fontSize: 12,
                    padding: '8px 24px',
                    borderRadius: 9999,
                    background: '#131B36',
                    color: '#8E9CBC',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  Cargar mensajes anteriores
                </button>
              </div>
            )}
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
              />
            ))}

            {/* Thinking indicator — shows at bottom of messages */}
            {agentThinking && (
              <ThinkingIndicator pendingCount={pendingCount || 0} />
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
