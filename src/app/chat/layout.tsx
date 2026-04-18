'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import ChannelList from '@/components/sidebar/ChannelList';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex overflow-hidden" style={{ height: '100dvh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-40 h-full flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 260,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <ChannelList onChannelSelect={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        {/* Mobile header */}
        <div
          className="md:hidden flex items-center flex-shrink-0"
          style={{
            gap: 12,
            padding: '0 16px',
            height: 56,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
            ClawHub
          </span>
        </div>

        {children}
      </main>
    </div>
  );
}
