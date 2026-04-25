'use client';

import { useEffect, useRef } from 'react';
import type { Message, TopicResult, DirectionResult, DraftResult } from '@/lib/types';
import { TopicCards }     from '@/components/TopicCards';
import { DirectionPanel } from '@/components/DirectionPanel';
import { DraftBox }       from '@/components/DraftBox';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onTopicSelect?: (topic: import('@/lib/types').Topic) => void;
  onDirectionConfirm?: () => void;
  onDirectionRevise?: () => void;
  onDraftCopy?: () => void;
  onDraftRevise?: () => void;
  onDraftReset?: () => void;
}

export function MessageList({
  messages,
  isLoading,
  onTopicSelect,
  onDirectionConfirm,
  onDirectionRevise,
  onDraftCopy,
  onDraftRevise,
  onDraftReset,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '18px', padding: '40px', textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'radial-gradient(circle, #e6b84a33 0%, #e6b84a08 60%, transparent 100%)',
            boxShadow: '0 0 40px #e6b84a22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          ✦
        </div>
        <div>
          <h2
            style={{
              fontSize: '20px', fontWeight: 700, color: '#e6edf3',
              fontFamily: "'Noto Serif KR', serif", marginBottom: '8px',
            }}
          >
            블로그 주제를 입력해주세요
          </h2>
          <p style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.8 }}>
            재테크 키워드를 알려주시면<br />
            <span style={{ color: '#e6b84a' }}>주제 추천 → 방향 설정 → 초안 작성</span>을<br />
            순서대로 도와드립니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            message={msg}
            onTopicSelect={onTopicSelect}
            onDirectionConfirm={onDirectionConfirm}
            onDirectionRevise={onDirectionRevise}
            onDraftCopy={onDraftCopy}
            onDraftRevise={onDraftRevise}
            onDraftReset={onDraftReset}
          />
        ))}

        {/* 로딩 버블 */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Avatar role="agent" />
            <div
              style={{
                padding: '12px 16px', background: '#161b22',
                border: '1px solid #30363d', borderRadius: '4px 14px 14px 14px',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#e6b84a',
                    display: 'inline-block',
                    animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div ref={bottomRef} />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── 개별 메시지 행 ──
function MessageRow({
  message: msg,
  onTopicSelect,
  onDirectionConfirm,
  onDirectionRevise,
  onDraftCopy,
  onDraftRevise,
  onDraftReset,
}: {
  message: Message;
  onTopicSelect?: (t: import('@/lib/types').Topic) => void;
  onDirectionConfirm?: () => void;
  onDirectionRevise?: () => void;
  onDraftCopy?: () => void;
  onDraftRevise?: () => void;
  onDraftReset?: () => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      <Avatar role={msg.role} />

      <div
        style={{
          maxWidth: msg.type && msg.type !== 'text' ? '100%' : '76%',
          flex: msg.type && msg.type !== 'text' ? 1 : undefined,
        }}
      >
        {/* 역할 레이블 */}
        <p
          style={{
            fontSize: '10px',
            color: '#484f58',
            marginBottom: '5px',
            textAlign: isUser ? 'right' : 'left',
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {isUser ? 'YOU' : 'AGENT'} ·{' '}
          {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* 말풍선 또는 카드 */}
        {msg.type === 'topics' && msg.data ? (
          <TopicCards
            data={msg.data as TopicResult}
            onSelect={onTopicSelect ?? (() => {})}
          />
        ) : msg.type === 'direction' && msg.data ? (
          <DirectionPanel
            data={msg.data as DirectionResult}
            onConfirm={onDirectionConfirm ?? (() => {})}
            onRevise={onDirectionRevise ?? (() => {})}
          />
        ) : msg.type === 'draft' && msg.data ? (
          <DraftBox
            data={msg.data as DraftResult}
            onCopy={onDraftCopy ?? (() => {})}
            onRevise={onDraftRevise ?? (() => {})}
            onReset={onDraftReset ?? (() => {})}
          />
        ) : (
          <div
            style={{
              padding: '10px 14px',
              background: isUser ? '#2d7dd222' : '#161b22',
              border: `1px solid ${isUser ? '#2d7dd255' : '#30363d'}`,
              borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              fontSize: '13px',
              color: '#e6edf3',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 아바타 ──
function Avatar({ role }: { role: 'user' | 'agent' }) {
  const isAgent = role === 'agent';
  return (
    <div
      style={{
        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
        background: isAgent
          ? 'linear-gradient(135deg, #e6b84a, #c9953a)'
          : 'linear-gradient(135deg, #2d7dd2, #1a5fa3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', marginTop: '18px',
      }}
    >
      {isAgent ? '✦' : '👤'}
    </div>
  );
}
