'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ChatContext } from '@/context/ChatContext';
import { useChat } from '@/hooks/useChat';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { StepBar } from '@/components/StepBar';
import { useAgentStore } from '@/lib/store';
import type { Step } from '@/lib/types';

const WELCOME_MSG =
  '안녕하세요! 재테크 블로그 에이전트입니다. 주제 탐색부터 SEO 최적화 초안 작성까지 함께 도와드릴게요.\n아래 버튼으로 시작하거나, 원하는 주제를 직접 입력해 주세요.';

export default function Home() {
  const [streamingText, setStreamingText] = useState('');

  const { currentStep, messages, addMessage } = useAgentStore();

  const { sendMessage, isLoading } = useChat({
    onStreamStart: () => setStreamingText(''),
    onStreamDelta: (delta) => setStreamingText((prev) => prev + delta),
    onStreamEnd:   () => setStreamingText(''),
    onParseError:  () =>
      toast.error('응답 파싱에 실패했습니다. 다시 시도해 주세요.', { duration: 4000 }),
  });

  // 메시지가 없으면(초기 마운트 or reset 후) 환영 메시지 추가
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      addMessage({ role: 'agent', content: WELCOME_MSG, type: 'text' });
    }
  // addMessage는 zustand 액션이라 변하지 않음 — messages.length 변화만 구독
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleUserSend = useCallback(
    async (text: string) => {
      let step: Step;
      if (currentStep === 1) {
        step = 'topic';
      } else if (currentStep === 2) {
        step = 'direction';
      } else if (currentStep === 3) {
        step = /작성|써/.test(text) ? 'draft' : 'direction';
      } else {
        step = 'freeform';
      }
      await sendMessage(text, step);
    },
    [currentStep, sendMessage]
  );

  // 환영 메시지만 있고 로딩 아닐 때 빠른 시작 버튼 표시
  const showWelcomeActions =
    messages.length === 1 &&
    messages[0]?.role === 'agent' &&
    currentStep === 1 &&
    !isLoading &&
    !streamingText;

  return (
    <ChatContext.Provider value={{ sendMessage, isLoading }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <StepBar currentStep={currentStep} />

        <MessageList streamingText={streamingText} />

        {/* 빠른 시작 버튼 — 환영 메시지 직후에만 노출 */}
        {showWelcomeActions && (
          <div
            style={{
              flexShrink: 0,
              padding: '0 24px 10px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <QuickButton
              onClick={() => handleUserSend('요즘 인기 있는 재테크 주제 추천해줘')}
              color="#e6b84a"
            >
              🔍 요즘 인기 주제 탐색
            </QuickButton>
            <QuickButton
              onClick={() => {
                document.querySelector<HTMLTextAreaElement>('textarea')?.focus();
              }}
              color="#2d7dd2"
            >
              ✏️ 직접 입력
            </QuickButton>
          </div>
        )}

        <ChatInput onSubmit={handleUserSend} disabled={isLoading} />
      </div>
    </ChatContext.Provider>
  );
}

// ── 인라인 헬퍼 컴포넌트 ──
function QuickButton({
  children,
  onClick,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        background: `${color}14`,
        border: `1px solid ${color}44`,
        borderRadius: '20px',
        color,
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}22`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = `${color}14`)}
    >
      {children}
    </button>
  );
}
