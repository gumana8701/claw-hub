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
  const [showAudio, setShowAudio] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSendText(trimmed);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }, [text, sending, onSendText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleAudioRecorded = async (blob: Blob, duration: number) => {
    setShowAudio(false);
    const ts = Date.now();
    const path = `audio-${ts}.webm`;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/attachments/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'audio/webm', 'x-upsert': 'true' },
      body: blob,
    });
    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
    await onSendFile({ message_type: 'audio', file_url: urlData.publicUrl, file_name: `audio-${ts}.webm`, file_size: blob.size, file_type: 'audio/webm', audio_duration: duration });
  };

  const handleFileUploaded = async (data: { file_url: string; file_name: string; file_size: number; file_type: string; message_type: 'file' | 'image' | 'audio'; }) => {
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
        const ts = Date.now();
        const ext = file.type.split('/')[1] || 'png';
        const path = `paste-${ts}.${ext}`;
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/attachments/${path}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': file.type, 'x-upsert': 'true' },
          body: file,
        });
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
        await onSendFile({ message_type: 'image', file_url: urlData.publicUrl, file_name: `paste-${ts}.${ext}`, file_size: file.size, file_type: file.type });
        break;
      }
    }
  };

  if (showAudio) {
    return (
      <div style={{ padding: '16px 32px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#050A1A' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <AudioRecorder onRecorded={handleAudioRecorded} />
        </div>
      </div>
    );
  }

  return (
    <div className="safe-bottom" style={{ padding: '16px 32px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#050A1A', flexShrink: 0 }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          background: '#0A1122',
          border: focused ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '10px 12px 10px 16px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          transition: 'border-color 150ms, box-shadow 150ms',
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        }}
      >
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4, paddingBottom: 4 }}>
          <FileUpload onUploaded={handleFileUploaded} />
          <button
            onClick={() => setShowAudio(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: '#5E6D93',
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1E2849'; e.currentTarget.style.color = '#8E9CBC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5E6D93'; }}
            title="Record audio"
          >
            🎤
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: 14,
            lineHeight: '22px',
            padding: '6px 0',
            resize: 'none',
            maxHeight: 120,
            fontFamily: 'inherit',
          }}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9999,
            background: text.trim() && !sending ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' : '#131B36',
            color: text.trim() && !sending ? '#fff' : '#5E6D93',
            border: 'none',
            cursor: text.trim() && !sending ? 'pointer' : 'default',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 150ms',
            marginBottom: 2,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
