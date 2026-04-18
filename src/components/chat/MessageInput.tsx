'use client';

import { useState, useRef, useCallback } from 'react';
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
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleAudioRecorded = async (blob: Blob, duration: number) => {
    const timestamp = Date.now();
    const filePath = `audio-${timestamp}.webm`;

    const { data: { session } } = await supabase.auth.getSession();

    // Upload audio
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

  // Handle paste for images
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

  return (
    <div className="px-4 py-3 safe-bottom" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <FileUpload onUploaded={handleFileUploaded} />
        <AudioRecorder onRecorded={handleAudioRecorded} />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-2.5 rounded-2xl text-sm resize-none outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              maxHeight: '120px',
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-opacity disabled:opacity-30"
          style={{ background: 'var(--accent)' }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
