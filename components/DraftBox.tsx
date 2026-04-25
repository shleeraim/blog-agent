'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { DraftResult } from '@/lib/types';

interface DraftBoxProps {
  data: DraftResult;
  onCopy:   () => void;
  onRevise: () => void;
  onReset:  () => void;
}

export function DraftBox({ data, onCopy, onRevise, onReset }: DraftBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.content);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '14px',
        padding: '18px', background: '#1c2330',
        border: '1px solid #30363d', borderRadius: '12px',
      }}
    >
      {/* 상단: 뱃지 + 메타 제목 */}
      <div>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '20px',
            background: '#56d36422', border: '1px solid #56d36444',
            fontSize: '11px', color: '#56d364', fontWeight: 600,
            marginBottom: '8px',
            fontFamily: "'DM Mono', monospace",
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#56d364', display: 'inline-block' }} />
          DRAFT COMPLETE
        </div>
        <h2
          style={{
            fontSize: '16px', fontWeight: 700, color: '#e6edf3',
            lineHeight: 1.45, fontFamily: "'Noto Serif KR', serif",
          }}
        >
          {data.meta_title}
        </h2>
      </div>

      {/* 태그 배지 */}
      {data.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {data.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px', padding: '2px 9px',
                borderRadius: '20px',
                background: '#e6b84a18',
                border: '1px solid #e6b84a55',
                color: '#e6b84a',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 본문 마크다운 */}
      <div
        style={{
          maxHeight: '400px', overflowY: 'auto',
          padding: '16px',
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '8px',
          fontSize: '13px', color: '#e6edf3',
          lineHeight: 1.85,
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '20px', color: '#e6edf3', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', color: '#e6b84a', fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 style={{ fontSize: '14px', color: '#c9d1d9', fontWeight: 600, marginTop: '14px', marginBottom: '6px' }}>{children}</h3>
            ),
            p:  ({ children }) => <p style={{ marginBottom: '10px', color: '#c9d1d9' }}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: '#e6edf3', fontWeight: 700 }}>{children}</strong>,
            ul: ({ children }) => <ul style={{ paddingLeft: '18px', marginBottom: '10px', color: '#c9d1d9' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: '18px', marginBottom: '10px', color: '#c9d1d9' }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: '4px', lineHeight: 1.75 }}>{children}</li>,
            code: ({ children }) => (
              <code style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', background: '#1c2330', padding: '1px 6px', borderRadius: '3px', color: '#e6b84a' }}>{children}</code>
            ),
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: '3px solid #e6b84a', paddingLeft: '12px', color: '#8b949e', margin: '10px 0', fontStyle: 'italic' }}>{children}</blockquote>
            ),
          }}
        >
          {data.content}
        </ReactMarkdown>
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', gap: '7px' }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 2, padding: '10px 12px',
            background: copied
              ? 'linear-gradient(135deg, #56d364, #3fb950)'
              : 'linear-gradient(135deg, #e6b84a, #c9953a)',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            color: '#0d1117', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✅ 복사됨!' : '📋 전체 복사'}
        </button>
        <button
          onClick={onRevise}
          style={ghostBtn}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; }}
        >
          🔄 수정
        </button>
        <button
          onClick={onReset}
          style={{ ...ghostBtn, borderColor: '#f8514944' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f85149'; e.currentTarget.style.color = '#f85149'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f8514944'; e.currentTarget.style.color = '#8b949e'; }}
        >
          🆕 새 주제
        </button>
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  flex: 1, padding: '10px 10px',
  background: 'transparent',
  border: '1px solid #30363d', borderRadius: '8px',
  fontSize: '12px', color: '#8b949e', cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
};
