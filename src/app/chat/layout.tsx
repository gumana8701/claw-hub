'use client';

import { useState } from 'react';
import ChannelList from '@/components/sidebar/ChannelList';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#050A1A' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.6)' }}
          className="md:hidden"
        />
      )}

      {/* Sidebar - Discord style: dark panel, 260px */}
      <aside
        className={`
          fixed md:relative z-40 h-full
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 260,
          flexShrink: 0,
          background: '#0A1122',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChannelList onChannelSelect={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#050A1A' }}>
        {/* Mobile hamburger header */}
        <div
          className="md:hidden"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 20px',
            height: 56,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: '#8E9CBC', cursor: 'pointer', fontSize: 20, padding: 4 }}
          >
            ☰
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>ClawHub</span>
        </div>

        {children}
      </main>
    </div>
  );
}
