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

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll && messages.length > prevMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, autoScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [loading]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    // Load more when scrolled to top
    if (el.scrollTop < 100 && hasMore && !loading) {
      onLoadMore();
    }

    // Track if user is near bottom
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-4"
    >
      {loading && messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet. Start the conversation!</p>
          </div>
        </div>
      ) : (
        <>
          {hasMore && (
            <div className="text-center py-3">
              <button
                onClick={onLoadMore}
                className="text-xs px-4 py-1.5 rounded-full"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
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
  );
}
