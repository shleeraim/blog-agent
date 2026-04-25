'use client';

import { useState } from 'react';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightPanel } from '@/components/layout/RightPanel';

type Tab = 'settings' | 'chat' | 'panel';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'settings', icon: '⚙️', label: '설정' },
  { id: 'chat',     icon: '💬', label: '대화' },
  { id: 'panel',    icon: '📋', label: '패널' },
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <div
      className="mobile-layout"
      style={{
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tab content area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Settings panel */}
        <div
          style={{
            display: activeTab === 'settings' ? 'block' : 'none',
            height: '100%',
            overflowY: 'auto',
            background: '#161b22',
            padding: '16px 12px',
          }}
        >
          <LeftSidebar />
        </div>

        {/* Chat area */}
        <div
          style={{
            display: activeTab === 'chat' ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            background: '#0d1117',
          }}
        >
          {children}
        </div>

        {/* Right panel */}
        <div
          style={{
            display: activeTab === 'panel' ? 'block' : 'none',
            height: '100%',
            overflowY: 'auto',
            background: '#161b22',
            padding: '16px 12px',
          }}
        >
          <RightPanel />
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        style={{
          flexShrink: 0,
          display: 'flex',
          borderTop: '1px solid #30363d',
          background: 'rgba(13, 17, 23, 0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {TABS.map(({ id, icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '10px 8px',
                background: 'none',
                border: 'none',
                borderTop: `2px solid ${active ? '#e6b84a' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#e6b84a' : '#484f58',
                  letterSpacing: '0.3px',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
