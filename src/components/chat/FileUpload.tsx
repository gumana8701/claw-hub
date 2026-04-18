'use client';

import { useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FileUploadProps {
  onUploaded: (data: {
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    message_type: 'file' | 'image' | 'audio';
  }) => void;
}

export default function FileUpload({ onUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${timestamp}-${safeName}`;

      // Use XHR for progress tracking
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('', file);

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/attachments/${filePath}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token}`);
        xhr.setRequestHeader('x-upsert', 'true');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);

      let messageType: 'file' | 'image' | 'audio' = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('audio/')) messageType = 'audio';

      onUploaded({
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        message_type: messageType,
      });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [supabase, onUploaded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept="*/*"
      />
      {uploading ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ background: 'var(--bg-tertiary)' }}>
          <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle
              cx="12" cy="12" r="10" fill="none"
              stroke="var(--accent)" strokeWidth="2"
              strokeDasharray={`${progress * 0.628} 62.8`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[8px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            {progress}
          </span>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors flex-shrink-0"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          title="Attach file"
        >
          📎
        </button>
      )}
    </div>
  );
}
