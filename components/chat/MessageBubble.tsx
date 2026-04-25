'use client';

import type { Message } from '@/lib/types';
import { TopicsCard } from '@/components/chat/cards/TopicsCard';
import { DirectionCard } from '@/components/chat/cards/DirectionCard';
import { DraftCard } from '@/components/chat/cards/DraftCard';
import { ErrorCard } from '@/components/chat/cards/ErrorCard';
import type { TopicResult, DirectionResult, DraftResult, ErrorData } from '@/lib/types';

function formatTime(date: Date) {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0' }}>
        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div
            style={{
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #1f6feb, #388bfd)',
              borderRadius: '16px 16px 4px 16px',
              fontSize: '13px',
              color: '#ffffff',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </div>
          <span style={{ fontSize: '10px', color: '#484f58' }}>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    );
  }

  // Agent message
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 0' }}>
      <div style={{ maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Agent label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
          <span
            style={{
              width: '20px', height: '20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #58a6ff, #bc8cff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', flexShrink: 0,
            }}
          >
            ✦
          </span>
          <span style={{ fontSize: '11px', color: '#484f58', fontWeight: 600 }}>Blog Agent</span>
          <span style={{ fontSize: '10px', color: '#484f58' }}>{formatTime(message.timestamp)}</span>
        </div>

        {/* Message card */}
        <div
          style={{
            padding: message.type === 'text' ? '10px 14px' : '14px',
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '4px 16px 16px 16px',
            fontSize: '13px',
            color: '#e6edf3',
            lineHeight: 1.7,
            whiteSpace: message.type === 'text' ? 'pre-wrap' : 'normal',
            wordBreak: 'break-word',
          }}
        >
          {message.type === 'topics' && message.data ? (
            <TopicsCard data={message.data as TopicResult} />
          ) : message.type === 'direction' && message.data ? (
            <DirectionCard data={message.data as DirectionResult} />
          ) : message.type === 'draft' && message.data ? (
            <DraftCard data={message.data as DraftResult} />
          ) : message.type === 'error' && message.data ? (
            <ErrorCard data={message.data as ErrorData} />
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  );
}

// 스트리밍 중인 메시지 표시 컴포넌트
export function StreamingBubble({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 0' }}>
      <div style={{ maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
          <span
            style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #58a6ff, #bc8cff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px',
            }}
          >
            ✦
          </span>
          <span style={{ fontSize: '11px', color: '#484f58', fontWeight: 600 }}>Blog Agent</span>
          <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: '#58a6ff',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </span>
        </div>
        <div
          style={{
            padding: '10px 14px',
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '4px 16px 16px 16px',
            fontSize: '13px',
            color: '#8b949e',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '120px',
            overflow: 'hidden',
            fontFamily: 'monospace',
          }}
        >
          {text.slice(-300) || '응답 생성 중...'}
          <span
            style={{
              display: 'inline-block',
              width: '2px', height: '14px',
              background: '#58a6ff',
              marginLeft: '2px',
              verticalAlign: 'middle',
              animation: 'blink 0.8s step-end infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}
