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
        <div className="cursor-pointer" onClick={() => setShowLightbox(true)}>
          <img
            src={fileUrl}
            alt={fileName || 'Image'}
            className="max-w-[300px] max-h-[300px] rounded-xl object-cover"
            loading="lazy"
          />
        </div>
        {showLightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setShowLightbox(false)}
          >
            <img
              src={fileUrl}
              alt={fileName || 'Image'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </>
    );
  }

  // Video
  if (fileType?.startsWith('video/')) {
    return (
      <video
        src={fileUrl}
        controls
        className="max-w-[300px] rounded-xl"
        preload="metadata"
      />
    );
  }

  // Generic file card
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl max-w-[300px] transition-colors no-underline"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <span className="text-2xl flex-shrink-0">{getFileIcon(fileType)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate font-medium" style={{ color: 'var(--text-primary)' }}>
          {fileName || 'File'}
        </p>
        {fileSize && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>↓</span>
    </a>
  );
}
