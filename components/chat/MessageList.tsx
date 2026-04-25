'use client';

import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/lib/store';
import { MessageBubble, StreamingBubble } from '@/components/chat/MessageBubble';

interface MessageListProps {
  streamingText: string;
}

const STEP_LABELS = ['주제 탐색', '방향 확정', '초안 작성', '완료'];

export function MessageList({ streamingText }: MessageListProps) {
  const { messages, currentStep } = useAgentStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 메시지 추가/스트리밍 시 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // 빈 상태
  if (messages.length === 0 && !streamingText) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '40px 24px',
          color: '#8b949e',
          textAlign: 'center',
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'radial-gradient(circle, #1f6feb 0%, #58a6ff22 60%, transparent 100%)',
            boxShadow: '0 0 50px #1f6feb44',
          }}
        />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e6edf3', marginBottom: '8px', letterSpacing: '-0.3px' }}>
            블로그 주제를 입력해주세요
          </h2>
          <p style={{ fontSize: '13px', lineHeight: 1.8, maxWidth: '360px' }}>
            원하는 카테고리나 키워드를 알려주면<br />
            <span style={{ color: '#58a6ff' }}>주제 추천 → 방향 설정 → 초안 작성</span>을 자동으로 진행합니다.
          </p>
        </div>

        {/* Suggestion chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['ETF 투자 입문', 'ISA 계좌 완벽 정리', '청약저축 활용법', '해외 주식 절세 전략'].map((chip) => (
            <span
              key={chip}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                background: '#21262d', border: '1px solid #30363d', color: '#8b949e',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* 진행 단계 표시 */}
      {messages.length > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', marginBottom: '16px',
          }}
        >
          {STEP_LABELS.map((label, i) => {
            const step = i + 1;
            const isDone = currentStep > step;
            const isCurrent = currentStep === step;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700,
                      background: isDone ? '#3fb950' : isCurrent ? '#1f6feb' : '#21262d',
                      border: `1px solid ${isDone ? '#3fb950' : isCurrent ? '#58a6ff' : '#30363d'}`,
                      color: isDone || isCurrent ? '#fff' : '#484f58',
                      transition: 'all 0.3s',
                    }}
                  >
                    {isDone ? '✓' : step}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: isCurrent ? '#e6edf3' : isDone ? '#3fb950' : '#484f58',
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    style={{
                      width: '24px', height: '1px',
                      background: isDone ? '#3fb950' : '#30363d',
                      transition: 'all 0.3s',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 메시지 목록 */}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* 스트리밍 버블 */}
      {streamingText && <StreamingBubble text={streamingText} />}

      {/* 스크롤 앵커 */}
      <div ref={bottomRef} />

      {/* 커스텀 CSS 애니메이션 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
