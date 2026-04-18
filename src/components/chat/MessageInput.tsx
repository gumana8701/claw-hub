'use client';

import { useState, useRef, useCallback } from 'react';
import { Paperclip, Mic, ArrowUp } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import FileUpload from './FileUpload';
import { createClient } from '@/lib/supabase/client';

interface MessageInputProps {
  onSendText: (content: string) => Promise<void>;
  onSendFile: (data: {
    content?: string;
    message_type: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    audio_duration?: number;
  }) => Promise<void>;
}

export default function MessageInput({ onSendText, onSendFile }: MessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSendText(trimmed);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }, [text, sending, onSendText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleAudioRecorded = async (blob: Blob, duration: number) => {
    setShowAudioRecorder(false);
    const timestamp = Date.now();
    const filePath = `audio-${timestamp}.webm`;

    const { data: { session } } = await supabase.auth.getSession();
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/attachments/${filePath}`;
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'audio/webm',
        'x-upsert': 'true',
      },
      body: blob,
    });

    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
    await onSendFile({
      message_type: 'audio',
      file_url: urlData.publicUrl,
      file_name: `audio-${timestamp}.webm`,
      file_size: blob.size,
      file_type: 'audio/webm',
      audio_duration: duration,
    });
  };

  const handleFileUploaded = async (data: {
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    message_type: 'file' | 'image' | 'audio';
  }) => {
    await onSendFile(data);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const timestamp = Date.now();
        const ext = file.type.split('/')[1] || 'png';
        const filePath = `paste-${timestamp}.${ext}`;
        const { data: { session } } = await supabase.auth.getSession();
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/attachments/${filePath}`;
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': file.type,
            'x-upsert': 'true',
          },
          body: file,
        });
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
        await onSendFile({
          message_type: 'image',
          file_url: urlData.publicUrl,
          file_name: `paste-${timestamp}.${ext}`,
          file_size: file.size,
          file_type: file.type,
        });
        break;
      }
    }
  };

  if (showAudioRecorder) {
    return (
      <div style={{ padding: '16px 32px 24px 32px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <AudioRecorder onRecorded={handleAudioRecorded} />
        </div>
      </div>
    );
  }

  return (
    <div className="safe-bottom" style={{ padding: '16px 32px 24px 32px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '8px 8px 8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'border-color 150ms',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {/* Action buttons */}
        <div className="flex" style={{ gap: 4 }}>
          <FileUpload onUploaded={handleFileUploaded} />
          <button
            onClick={() => setShowAudioRecorder(true)}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            title="Record audio"
          >
            <Mic size={16} />
          </button>
        </div>

        {/* Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
            padding: '8px 4px',
            resize: 'none',
            maxHeight: 120,
            fontFamily: 'inherit',
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--gradient-brand)',
            color: '#fff',
            border: 'none',
            cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
            opacity: text.trim() && !sending ? 1 : 0.4,
            transition: 'opacity 150ms',
          }}
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
