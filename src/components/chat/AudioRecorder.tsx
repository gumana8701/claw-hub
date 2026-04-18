'use client';

import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { formatTime } from '@/lib/utils';

interface AudioRecorderProps {
  onRecorded: (blob: Blob, duration: number) => void;
}

export default function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = useAudioRecorder();

  const handleToggle = async () => {
    if (isRecording) {
      const { blob, duration } = await stopRecording();
      onRecorded(blob, duration);
    } else {
      await startRecording();
    }
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={cancelRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--danger)' }}
          title="Cancel"
        >
          ✕
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--danger)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {formatTime(duration)}
          </span>
        </div>
        <button
          onClick={handleToggle}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
          title="Send"
        >
          ↑
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors flex-shrink-0"
      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
      title="Record audio"
    >
      🎤
    </button>
  );
}
