'use client';

interface ThinkingIndicatorProps {
  pendingCount: number;
}

export default function ThinkingIndicator({ pendingCount }: ThinkingIndicatorProps) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 0' }}>
      {/* Agent avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        AI
      </div>

      {/* Thinking bubble */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#3B82F6' }}>Agent</span>
        </div>
        <div
          style={{
            background: '#0D1526',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Animated dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#3B82F6',
                  animation: `thinkBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Status text */}
          <span style={{ fontSize: 13, color: '#5E6D93' }}>
            Pensando...
            {pendingCount > 1 && (
              <span style={{
                marginLeft: 10,
                padding: '2px 10px',
                borderRadius: 9999,
                background: 'rgba(59,130,246,0.15)',
                color: '#3B82F6',
                fontSize: 11,
                fontWeight: 600,
              }}>
                +{pendingCount - 1} en cola
              </span>
            )}
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes thinkBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 12px 4px rgba(59,130,246,0.2); }
        }
      `}</style>
    </div>
  );
}
