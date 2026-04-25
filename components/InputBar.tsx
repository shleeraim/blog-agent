'use client';

import { useRef, useState, useCallback, KeyboardEvent } from 'react';

interface InputBarProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export function InputBar({ onSend, isLoading }: InputBarProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim().length > 0 && !isLoading;

  // 자동 리사이즈
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, []);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [canSend, onSend, text]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        flexShrink: 0,
        padding: '12px 16px 16px',
        borderTop: '1px solid #30363d',
        background: '#0d1117',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          padding: '10px 14px',
          background: '#1c2330',
          border: `1px solid ${focused ? '#e6b84a' : '#30363d'}`,
          borderRadius: '12px',
          boxShadow: focused ? '0 0 0 3px #e6b84a18' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isLoading ? 'AI가 응답 중입니다...' : '재테크 키워드나 주제를 입력하세요 (Enter 전송)'}
          disabled={isLoading}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '13px',
            color: '#e6edf3',
            lineHeight: 1.65,
            minHeight: '22px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: "'Noto Sans KR', sans-serif",
            cursor: isLoading ? 'not-allowed' : 'text',
          }}
        />

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          title="전송 (Enter)"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            border: 'none',
            background: canSend
              ? 'linear-gradient(135deg, #e6b84a, #c9953a)'
              : '#21262d',
            color: canSend ? '#0d1117' : '#484f58',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '16px',
            fontWeight: 700,
            transition: 'all 0.15s',
            transform: canSend ? 'scale(1)' : 'scale(0.93)',
          }}
          onMouseEnter={(e) => { if (canSend) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          {isLoading ? (
            <span
              style={{
                width: '14px', height: '14px',
                border: '2px solid #484f58',
                borderTopColor: '#e6b84a',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.75s linear infinite',
              }}
            />
          ) : '↑'}
        </button>
      </div>

      {/* 힌트 */}
      <p style={{ fontSize: '10px', color: '#484f58', marginTop: '6px', paddingInline: '4px' }}>
        Enter 전송 · Shift+Enter 줄바꿈
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
