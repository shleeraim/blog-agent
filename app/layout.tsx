import type { Metadata } from 'next';
import './globals.css';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Blog Agent — AI 블로그 작성 도우미',
  description: 'Claude AI 기반 재테크 블로그 주제 추천, 방향성 설정, 초안 작성 자동화 에이전트',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            background: '#0d1117',
          }}
        >
          {/* ── Header ── */}
          <header
            style={{
              height: '56px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              background: 'rgba(13, 17, 23, 0.95)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid #30363d',
              zIndex: 50,
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #58a6ff, #bc8cff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                }}
              >
                ✦ Blog Agent
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: '#1f6feb22',
                  border: '1px solid #1f6feb66',
                  color: '#58a6ff',
                  letterSpacing: '0.3px',
                }}
              >
                claude-sonnet-4
              </span>
            </div>

            {/* Center nav */}
            <HeaderNav />

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3fb950',
                  boxShadow: '0 0 6px #3fb95088',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '12px', color: '#8b949e' }}>준비됨</span>
            </div>
          </header>

          {/* ── Desktop: 3-column layout (hidden on mobile) ── */}
          <div
            className="desktop-layout"
            style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
          >
            {/* Left sidebar — 260px */}
            <aside
              style={{
                width: '260px',
                flexShrink: 0,
                background: '#161b22',
                borderRight: '1px solid #30363d',
                overflowY: 'auto',
                padding: '16px 12px',
              }}
            >
              <LeftSidebar />
            </aside>

            {/* Center chat — flex-1 */}
            <main
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: '#0d1117',
              }}
            >
              {children}
            </main>

            {/* Right panel — 280px */}
            <aside
              style={{
                width: '280px',
                flexShrink: 0,
                background: '#161b22',
                borderLeft: '1px solid #30363d',
                overflowY: 'auto',
                padding: '16px 12px',
              }}
            >
              <RightPanel />
            </aside>
          </div>

          {/* ── Mobile layout (hidden on desktop) ── */}
          <MobileLayout>{children}</MobileLayout>
        </div>

        <Toaster position="bottom-center" />

        <style>{`
          .desktop-layout { display: flex; }
          .mobile-layout  { display: none; }
          @media (max-width: 768px) {
            .desktop-layout { display: none !important; }
            .mobile-layout  { display: flex !important; }
          }
        `}</style>
      </body>
    </html>
  );
}
