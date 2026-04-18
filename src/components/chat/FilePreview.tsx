'use client';

import { useState } from 'react';
import { formatFileSize, getFileIcon } from '@/lib/utils';
import AudioPlayer from './AudioPlayer';

interface FilePreviewProps {
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  audioDuration?: number | null;
}

export default function FilePreview({ fileUrl, fileName, fileSize, fileType, audioDuration }: FilePreviewProps) {
  const [showLightbox, setShowLightbox] = useState(false);

  // Audio
  if (fileType?.startsWith('audio/')) {
    return <AudioPlayer src={fileUrl} duration={audioDuration} />;
  }

  // Image
  if (fileType?.startsWith('image/')) {
    return (
      <>
        <div style={{ cursor: 'pointer' }} onClick={() => setShowLightbox(true)}>
          <img
            src={fileUrl}
            alt={fileName || 'Image'}
            style={{ maxWidth: 300, maxHeight: 300, borderRadius: 12, objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
        {showLightbox && (
          <div
            onClick={() => setShowLightbox(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'pointer', background: 'rgba(0,0,0,0.9)' }}
          >
            <img src={fileUrl} alt={fileName || 'Image'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}
      </>
    );
  }

  // Video
  if (fileType?.startsWith('video/')) {
    return (
      <video src={fileUrl} controls preload="metadata" style={{ maxWidth: 300, borderRadius: 12 }} />
    );
  }

  // Generic file card
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        maxWidth: 300,
        textDecoration: 'none',
        background: '#131B36',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>{getFileIcon(fileType)}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#CBD5E1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
          {fileName || 'File'}
        </p>
        {fileSize && (
          <p style={{ fontSize: 11, color: '#5E6D93', margin: '2px 0 0' }}>{formatFileSize(fileSize)}</p>
        )}
      </div>
      <span style={{ fontSize: 14, color: '#5E6D93' }}>↓</span>
    </a>
  );
}
