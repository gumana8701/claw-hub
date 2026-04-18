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
      const ts = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${ts}-${safeName}`;
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/attachments/${filePath}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token}`);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => { xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)); };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
      let messageType: 'file' | 'image' | 'audio' = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('audio/')) messageType = 'audio';

      onUploaded({ file_url: urlData.publicUrl, file_name: file.name, file_size: file.size, file_type: file.type, message_type: messageType });
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
    <>
      <input ref={inputRef} type="file" onChange={handleChange} style={{ display: 'none' }} accept="*/*" />
      {uploading ? (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#1E2849',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#3B82F6',
          }}
        >
          {progress}%
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'transparent',
            border: 'none',
            color: '#5E6D93',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1E2849'; e.currentTarget.style.color = '#8E9CBC'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5E6D93'; }}
          title="Adjuntar archivo"
        >
          📎
        </button>
      )}
    </>
  );
}
