import { Zap } from 'lucide-react';

export default function ChatIndex() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-brand)',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-glow-violet)',
          }}
        >
          <Zap size={28} color="#fff" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
          Welcome to ClawHub
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
          Select a channel or create one to start chatting with your agents.
        </p>
      </div>
    </div>
  );
}
