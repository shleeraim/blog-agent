'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ChatContext } from '@/context/ChatContext';
import { useChat } from '@/hooks/useChat';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { StepBar } from '@/components/StepBar';
import { PipelineStatus, type PipelineSteps } from '@/components/PipelineStatus';
import { DualDraftBox } from '@/components/DualDraftBox';
import { useAgentStore } from '@/lib/store';
import type { Step, TopicEvaluation } from '@/lib/types';

const WELCOME_AUTO =
  '안녕하세요! 재테크 블로그 에이전트입니다.\n🚀 자동 완성 모드가 켜져 있습니다. 주제를 입력하면 탐색 → SEO 평가 → 2개 초안까지 자동으로 완성합니다.';
const WELCOME_MANUAL =
  '안녕하세요! 재테크 블로그 에이전트입니다.\n🔧 수동 모드입니다. 주제 탐색만 하거나 원하는 주제를 직접 입력해 주세요.';

const AUTO_PLACEHOLDER = '어떤 주제로 작성할까요? (예: ETF 투자, 부동산 절세, ISA 활용법...)';

const INITIAL_PIPELINE: PipelineSteps = {
  topic: 'idle', evaluate: 'idle',
  draft1: 'idle', notes1: 'idle',
  draft2: 'idle', notes2: 'idle',
};

// ── Apple Notes 자동 저장 헬퍼 ──────────────────
async function autoSaveNotes(
  draft: import('@/lib/types').DraftResult,
  topicEval: TopicEvaluation | undefined
): Promise<boolean> {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft,
        seoScore: topicEval?.seo_score ?? 0,
        searchVolume: topicEval?.search_volume ?? 0,
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
export default function Home() {
  const [streamingText, setStreamingText] = useState('');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineSteps>(INITIAL_PIPELINE);
  const [selectedTitles, setSelectedTitles] = useState<[string, string] | null>(null);
  const [stepMessages, setStepMessages] = useState<Partial<Record<keyof PipelineSteps, string>>>({});

  const {
    currentStep,
    messages,
    addMessage,
    isPipelineRunning,
    drafts,
    selectedTopics,
    autoMode,
    reset,
    setStep,
    removeDraft,
    clearDrafts,
  } = useAgentStore();

  const { sendMessage, isLoading } = useChat({
    onStreamStart: () => setStreamingText(''),
    onStreamDelta: (delta) => setStreamingText((prev) => prev + delta),
    onStreamEnd:   () => setStreamingText(''),
    onParseError:  () =>
      toast.error('응답 파싱에 실패했습니다. 다시 시도해 주세요.', { duration: 4000 }),
  });

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // 첫 마운트 또는 reset 후 환영 메시지
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      const { autoMode: currentAutoMode } = useAgentStore.getState();
      addMessage({
        role: 'agent',
        content: currentAutoMode ? WELCOME_AUTO : WELCOME_MANUAL,
        type: 'text',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // autoMode 변경 시 환영 메시지 업데이트
  useEffect(() => {
    const state = useAgentStore.getState();
    if (state.messages.length === 1 && state.messages[0]?.role === 'agent') {
      // 환영 메시지만 있을 때만 교체
      state.clearMessages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode]);

  // ──────────────────────────────────────────────
  // 자동 파이프라인
  // ──────────────────────────────────────────────

  const runAutoPipeline = useCallback(async (userMessage: string) => {
    const store = useAgentStore.getState();
    store.setIsPipelineRunning(true);
    setPipelineSteps({ topic: 'running', evaluate: 'idle', draft1: 'idle', notes1: 'idle', draft2: 'idle', notes2: 'idle' });
    setSelectedTitles(null);
    setStepMessages({});

    try {
      // ── Step 1: 주제 탐색 ──────────────────────────
      await sendMessageRef.current(userMessage, 'topic', { noStepAdvance: true });

      const { topics, settings } = useAgentStore.getState();
      if (topics.length === 0) {
        toast.error('주제 탐색에 실패했습니다. 다시 시도해 주세요.');
        return;
      }
      setPipelineSteps((p) => ({ ...p, topic: 'done', evaluate: 'running' }));

      // ── Step 2: SEO 평가 ───────────────────────────
      useAgentStore.getState().setIsEvaluating(true);

      let selected: TopicEvaluation[] = [];
      let evalSuccess = false;

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 'evaluate',
            topics: topics.map((t) => t.title),
            categories: settings.categories,
            settings,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const st = useAgentStore.getState();
        st.setEvaluations(data.evaluations ?? []);
        st.setSelectionReason(data.selection_reason ?? '');
        const sel: TopicEvaluation[] = ((data.evaluations ?? []) as TopicEvaluation[])
          .filter((e) => e.selected)
          .sort((a, b) => a.rank - b.rank);
        st.setSelectedTopics(sel);
        selected = sel;
        evalSuccess = sel.length >= 2;
      } catch {
        evalSuccess = false;
      } finally {
        useAgentStore.getState().setIsEvaluating(false);
      }

      // ① 평가 실패 → 수동 선택 모드 전환
      if (!evalSuccess) {
        useAgentStore.getState().setEvaluations([]); // 점수 바 숨기고 카드 클릭 활성화
        toast.error('SEO 평가에 실패했습니다. 수동으로 주제를 선택해주세요.', { duration: 5000 });
        setPipelineSteps((p) => ({ ...p, evaluate: 'failed' }));
        useAgentStore.getState().addMessage({
          role: 'agent',
          content: '📋 수동 선택 모드 — 위 주제 카드를 직접 클릭하여 원하는 주제를 선택해주세요.',
          type: 'text',
        });
        return; // outer finally에서 isPipelineRunning(false) 처리
      }

      const titles: [string, string] = [selected[0].title, selected[1].title];
      setSelectedTitles(titles);
      setPipelineSteps((p) => ({ ...p, evaluate: 'done', draft1: 'running' }));

      // 3초 대기 — 사용자가 평가 결과 확인
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // ── Step 3: 1번 초안 ───────────────────────────
      const storeTopics = useAgentStore.getState().topics;
      const topicObj1 = storeTopics.find((t) => t.title === titles[0]) ?? storeTopics[0];
      useAgentStore.getState().setSelectedTopic(topicObj1);
      useAgentStore.getState().clearApiHistory();
      useAgentStore.getState().setDraft(null); // 이전 draft 초기화

      await sendMessageRef.current(
        `주제 "${titles[0]}"로 블로그 방향성을 설정해주세요.`,
        'direction', { noStepAdvance: true }
      );
      await sendMessageRef.current(
        '이 방향으로 블로그 초안을 작성해주세요.',
        'draft', { noStepAdvance: true }
      );

      const draft1 = useAgentStore.getState().draft;

      // ② 1번 초안 실패 → 2번으로 진행
      if (!draft1) {
        setPipelineSteps((p) => ({ ...p, draft1: 'failed', draft2: 'running' }));
        setStepMessages((prev) => ({
          ...prev,
          draft1: '⚠️ 1번 초안 생성 실패 — 2번으로 진행',
        }));
      } else {
        useAgentStore.getState().addDraft(draft1);
        setPipelineSteps((p) => ({ ...p, draft1: 'done', notes1: 'running' }));

        // Apple Notes 자동 저장 (1번)
        const topic1Eval = useAgentStore.getState().selectedTopics[0];
        const notes1Ok = await autoSaveNotes(draft1, topic1Eval);

        // ③ Notes 저장 실패 → 파이프라인 계속, 경고 표시
        if (notes1Ok) {
          setPipelineSteps((p) => ({ ...p, notes1: 'done' }));
        } else {
          setPipelineSteps((p) => ({ ...p, notes1: 'failed' }));
          setStepMessages((prev) => ({
            ...prev,
            notes1: '⚠️ Apple Notes 저장 실패 (수동 저장 버튼으로 재시도 가능)',
          }));
        }
      }

      // ── Step 4: 2번 초안 ───────────────────────────
      setPipelineSteps((p) => ({ ...p, draft2: 'running' }));

      const topicObj2 = storeTopics.find((t) => t.title === titles[1]) ?? storeTopics[1];
      useAgentStore.getState().setSelectedTopic(topicObj2);
      useAgentStore.getState().clearApiHistory();
      useAgentStore.getState().setDraft(null);

      await sendMessageRef.current(
        `주제 "${titles[1]}"로 블로그 방향성을 설정해주세요.`,
        'direction', { noStepAdvance: true }
      );
      await sendMessageRef.current(
        '이 방향으로 블로그 초안을 작성해주세요.',
        'draft', { noStepAdvance: true }
      );

      const draft2 = useAgentStore.getState().draft;

      if (!draft2) {
        setPipelineSteps((p) => ({ ...p, draft2: 'failed' }));
        setStepMessages((prev) => ({ ...prev, draft2: '⚠️ 2번 초안 생성 실패' }));
      } else {
        useAgentStore.getState().addDraft(draft2);
        setPipelineSteps((p) => ({ ...p, draft2: 'done', notes2: 'running' }));

        const topic2Eval = useAgentStore.getState().selectedTopics[1];
        const notes2Ok = await autoSaveNotes(draft2, topic2Eval);

        if (notes2Ok) {
          setPipelineSteps((p) => ({ ...p, notes2: 'done' }));
        } else {
          setPipelineSteps((p) => ({ ...p, notes2: 'failed' }));
          setStepMessages((prev) => ({
            ...prev,
            notes2: '⚠️ Apple Notes 저장 실패 (수동 저장 버튼으로 재시도 가능)',
          }));
        }
      }

      useAgentStore.getState().setStep(4);

      const doneDrafts = useAgentStore.getState().drafts;
      if (doneDrafts.length >= 1) {
        toast.success(`${doneDrafts.length}개 초안이 완성되었습니다! 🎉`, { duration: 4000 });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '파이프라인 실행 중 오류가 발생했습니다.';
      toast.error(msg, { duration: 5000 });
    } finally {
      useAgentStore.getState().setIsPipelineRunning(false);
    }
  }, []);

  // ──────────────────────────────────────────────
  // 메시지 전송 핸들러
  // ──────────────────────────────────────────────

  const handleUserSend = useCallback(async (text: string) => {
    const state = useAgentStore.getState();
    const isFreshSession =
      state.currentStep === 1 &&
      state.messages.length <= 1 &&
      state.drafts.length === 0 &&
      state.topics.length === 0;

    // 자동 모드 + 새 세션: 파이프라인 실행
    if (state.autoMode && isFreshSession) {
      await runAutoPipeline(text);
      return;
    }

    // 수동 모드 또는 진행 중인 세션: 단계별 라우팅
    let step: Step;
    if (state.currentStep === 1) step = 'topic';
    else if (state.currentStep === 2) step = 'direction';
    else if (state.currentStep === 3) step = /작성|써/.test(text) ? 'draft' : 'direction';
    else step = 'freeform';

    await sendMessage(text, step);
  }, [sendMessage, runAutoPipeline]);

  // ──────────────────────────────────────────────
  // DualDraftBox 핸들러
  // ──────────────────────────────────────────────

  const handleCopyAll = useCallback(() => {}, []);
  const handleCopyOne = useCallback((_i: number) => {}, []);
  const handleSaveToNotes = useCallback((_i: number) => {}, []);

  const handleRewrite = useCallback((index: number) => {
    removeDraft(index);
    setStep(3);
    toast('💬 아래 채팅창에 수정 요청을 입력해주세요.', { duration: 3500 });
    setTimeout(() => document.querySelector<HTMLTextAreaElement>('textarea')?.focus(), 100);
  }, [removeDraft, setStep]);

  const handleReset = useCallback(() => {
    clearDrafts();
    setPipelineSteps(INITIAL_PIPELINE);
    setSelectedTitles(null);
    setStepMessages({});
    reset();
  }, [clearDrafts, reset]);

  // ──────────────────────────────────────────────
  // 렌더링 조건
  // ──────────────────────────────────────────────

  const showWelcomeActions =
    messages.length === 1 &&
    messages[0]?.role === 'agent' &&
    currentStep === 1 &&
    !isLoading &&
    !streamingText &&
    !isPipelineRunning;

  const inputDisabled = isLoading || isPipelineRunning;
  const inputPlaceholder = autoMode && showWelcomeActions ? AUTO_PLACEHOLDER : undefined;

  return (
    <ChatContext.Provider value={{ sendMessage, isLoading }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <StepBar currentStep={currentStep} />

        {/* drafts >= 1 → DualDraftBox / 그 외 → 채팅 */}
        {drafts.length >= 1 ? (
          <DualDraftBox
            drafts={drafts}
            selectedTopics={selectedTopics}
            streamingText={drafts.length < 2 ? streamingText : undefined}
            onCopyAll={handleCopyAll}
            onCopyOne={handleCopyOne}
            onRewrite={handleRewrite}
            onReset={handleReset}
            onSaveToNotes={handleSaveToNotes}
          />
        ) : (
          <MessageList streamingText={streamingText} />
        )}

        {/* 파이프라인 진행 상태 */}
        {isPipelineRunning && (
          <PipelineStatus
            steps={pipelineSteps}
            selectedTitles={selectedTitles}
            stepMessages={stepMessages}
          />
        )}

        {/* 빠른 시작 버튼 */}
        {showWelcomeActions && (
          <div style={{ flexShrink: 0, padding: '0 16px 10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {autoMode ? (
              // 자동 모드: 입력창 포커스만
              <QuickButton
                onClick={() => document.querySelector<HTMLTextAreaElement>('textarea')?.focus()}
                color="#e6b84a"
              >
                ✏️ 주제 입력하기
              </QuickButton>
            ) : (
              // 수동 모드: 탐색 + 직접 입력
              <>
                <QuickButton
                  onClick={() => handleUserSend('요즘 인기 있는 재테크 주제 추천해줘')}
                  color="#2d7dd2"
                >
                  🔍 주제 탐색만
                </QuickButton>
                <QuickButton
                  onClick={() => document.querySelector<HTMLTextAreaElement>('textarea')?.focus()}
                  color="#484f58"
                >
                  ✏️ 직접 입력
                </QuickButton>
              </>
            )}
          </div>
        )}

        <ChatInput
          onSubmit={handleUserSend}
          disabled={inputDisabled}
          placeholder={inputPlaceholder}
        />
      </div>
    </ChatContext.Provider>
  );
}

// ── 인라인 헬퍼 컴포넌트 ──
function QuickButton({
  children, onClick, color,
}: { children: React.ReactNode; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px', background: `${color}14`,
        border: `1px solid ${color}44`, borderRadius: '20px',
        color, fontSize: '12px', fontWeight: 600,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}22`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = `${color}14`)}
    >
      {children}
    </button>
  );
}
