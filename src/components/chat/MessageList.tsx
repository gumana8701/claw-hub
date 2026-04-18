'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '@/types/database';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId: string | null;
}

export default function MessageList({ messages, loading, hasMore, onLoadMore, currentUserId }: MessageListProps) {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [loading]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasMore && !loading) {
      onLoadMore();
    }
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
      style={{ padding: '24px 32px', scrollBehavior: 'smooth' }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: '100%', minHeight: 200 }}>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: '100%', minHeight: 200 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <button
                  onClick={onLoadMore}
                  style={{
                    fontSize: 12,
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg-surface-raised)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  Load older messages
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
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
