export default function ChatIndex() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-5xl mb-4">⚡</p>
        <h2 className="text-xl font-bold mb-2">Welcome to ClawHub</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Select a channel or create one to start chatting with your agents.
        </p>
      </div>
    </div>
  );
}
