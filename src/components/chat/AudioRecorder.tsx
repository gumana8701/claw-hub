'use client';

import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { formatTime } from '@/lib/utils';

interface AudioRecorderProps {
  onRecorded: (blob: Blob, duration: number) => void;
}

export default function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const { isRecording, duration, permissionDenied, startRecording, stopRecording, cancelRecording } = useAudioRecorder();

  const handleStop = async () => {
    try {
      const { blob, duration } = await stopRecording();
      if (duration > 0.5) { // Ignore accidental taps < 0.5s
        onRecorded(blob, duration);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStart = async () => {
    try {
      await startRecording();
    } catch {
      // Permission error handled in hook
    }
  };

  if (permissionDenied) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '16px 20px',
          background: '#131B36',
          borderRadius: 14,
          border: '1px solid rgba(239,68,68,0.3)',
        }}
      >
        <span style={{ fontSize: 14, color: '#EF4444' }}>
          ⚠️ Micrófono bloqueado — actívalo en la configuración del navegador
        </span>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '6px 16px',
            borderRadius: 8,
            background: '#1E2849',
            color: '#8E9CBC',
            border: 'none',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#131B36',
          borderRadius: 14,
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        {/* Cancel button */}
        <button
          onClick={cancelRecording}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            color: '#EF4444',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title="Cancelar"
        >
          ✕
        </button>

        {/* Recording indicator + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#EF4444',
              animation: 'recPulse 1s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#fff', letterSpacing: '0.02em' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Send button — big and easy to tap on mobile */}
        <button
          onClick={handleStop}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: '#fff',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(59,130,246,0.3)',
          }}
          title="Enviar"
        >
          ↑
        </button>

        <style>{`
          @keyframes recPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
          }
        `}</style>
      </div>
    );
  }

  // Not recording — show start button
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
        background: '#131B36',
        borderRadius: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#5E6D93' }}>Toca para grabar</span>
        <button
          onClick={handleStart}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: '#fff',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(59,130,246,0.25)',
          }}
          title="Grabar audio"
        >
          🎤
        </button>
        <button
          onClick={() => {
            // Go back to text input — parent handles this by toggling showAudio
            const event = new CustomEvent('cancelAudioMode');
            window.dispatchEvent(event);
          }}
          style={{
            fontSize: 13,
            color: '#5E6D93',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
