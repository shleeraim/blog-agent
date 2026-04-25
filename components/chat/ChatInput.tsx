'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useAgentStore } from '@/lib/store';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

const STEP_PLACEHOLDERS: Record<number, string> = {
  1: '어떤 분야의 주제를 탐색할까요? (예: ETF 관련 주제 추천해줘)',
  2: '주제를 선택하거나 방향을 직접 입력하세요...',
  3: '방향을 확정하거나 수정 요청을 입력하세요...',
  4: '수정 요청이나 추가 작업을 입력하세요...',
};

export function ChatInput({ onSubmit, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const { currentStep } = useAgentStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const placeholder = STEP_PLACEHOLDERS[currentStep] ?? '메시지를 입력하세요';
  const canSubmit = text.trim().length > 0 && !disabled;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        flexShrink: 0,
        padding: '12px 16px 16px',
        borderTop: '1px solid #30363d',
        background: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Input row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
          padding: '10px 12px',
          background: '#161b22',
          border: `1px solid ${focused ? '#e6b84a' : disabled ? '#30363d' : '#30363d'}`,
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
          placeholder={disabled ? '응답 생성 중...' : placeholder}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '13px',
            color: '#e6edf3',
            lineHeight: 1.6,
            minHeight: '22px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: "'Noto Sans KR', sans-serif",
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '34px', height: '34px',
            borderRadius: '8px',
            border: 'none',
            background: canSubmit
              ? 'linear-gradient(135deg, #e6b84a, #c9953a)'
              : '#21262d',
            color: canSubmit ? '#0d1117' : '#484f58',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
            transition: 'all 0.15s',
            transform: canSubmit ? 'scale(1)' : 'scale(0.95)',
          }}
          title="전송 (Enter)"
        >
          {disabled ? (
            <span
              style={{
                width: '14px', height: '14px',
                border: '2px solid #484f58',
                borderTopColor: '#e6b84a',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }}
            />
          ) : '↑'}
        </button>
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: '4px' }}>
        <span style={{ fontSize: '11px', color: '#484f58' }}>
          Enter 전송 · Shift+Enter 줄바꿈
        </span>
        {text.length > 0 && (
          <span style={{ fontSize: '11px', color: '#484f58' }}>
            {text.length}자
          </span>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
