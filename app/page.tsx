'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ChatContext } from '@/context/ChatContext';
import { useChat } from '@/hooks/useChat';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { StepBar } from '@/components/StepBar';
import { PipelineStatus, type PipelineStep } from '@/components/PipelineStatus';
import { DualDraftBox } from '@/components/DualDraftBox';
import { DraftBox } from '@/components/DraftBox';
import { useAgentStore } from '@/lib/store';
import type { Step } from '@/lib/types';

// ── 파이프라인 초기 상태 ────────────────────────────
const INITIAL_PIPELINE_STEPS: PipelineStep[] = [
  { id: 'topic',        label: '🔍 주제 탐색',          status: 'waiting' },
  { id: 'evaluate',     label: '📊 SEO 자동 평가',       status: 'waiting' },
  { id: 'select',       label: '🏆 최적 주제 선택',       status: 'waiting' },
  { id: 'draft',        label: '✍️ 초안 작성',           status: 'waiting' },
  { id: 'imagePrompts', label: '🎨 이미지 프롬프트 생성', status: 'waiting' },
  { id: 'images',       label: '🖼️ 이미지 생성',        status: 'waiting' },
];

const WELCOME_AUTO =
  '안녕하세요! 재테크 블로그 에이전트입니다.\n🚀 자동 완성 모드가 켜져 있습니다. 주제를 입력하면 탐색 → SEO 평가 → 초안 → 이미지까지 자동으로 완성합니다.';
const WELCOME_MANUAL =
  '안녕하세요! 재테크 블로그 에이전트입니다.\n🔧 수동 모드입니다. 주제 탐색만 하거나 원하는 주제를 직접 입력해 주세요.';

const AUTO_PLACEHOLDER = '어떤 주제로 작성할까요? (예: ETF 투자, 부동산 절세, ISA 활용법...)';

// ──────────────────────────────────────────────
export default function Home() {
  const [streamingText, setStreamingText] = useState('');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(INITIAL_PIPELINE_STEPS);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    currentStep,
    messages,
    addMessage,
    isPipelineRunning,
    drafts,
    selectedTopics,
    autoMode,
    generatedImages,
    imagePrompts,
    isGeneratingImages,
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

  // autoMode 변경 시 환영 메시지 교체
  useEffect(() => {
    const state = useAgentStore.getState();
    if (state.messages.length === 1 && state.messages[0]?.role === 'agent') {
      state.clearMessages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode]);

  // ──────────────────────────────────────────────
  // 6단계 자동 파이프라인
  // ──────────────────────────────────────────────

  const runAutoPipeline = useCallback(async (userMessage: string) => {
    const updateStep = (id: string, status: PipelineStep['status'], detail?: string) => {
      setPipelineSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status, detail } : s))
      );
    };

    const store = useAgentStore.getState();
    store.setIsPipelineRunning(true);
    store.clearDrafts();
    store.setDraft(null);
    store.setImagePrompts([]);
    store.setGeneratedImages([]);
    setPipelineSteps(INITIAL_PIPELINE_STEPS);

    try {
      // ── Step 1: 주제 탐색 ──────────────────────────
      updateStep('topic', 'running');
      await sendMessageRef.current(userMessage, 'topic', { noStepAdvance: true });

      const { topics, settings } = useAgentStore.getState();
      if (topics.length === 0) {
        toast.error('주제 탐색에 실패했습니다. 다시 시도해 주세요.');
        updateStep('topic', 'error', '주제 탐색 실패');
        return;
      }
      updateStep('topic', 'done', '5개 주제 탐색 완료');

      // ── Step 2: SEO 평가 ───────────────────────────
      updateStep('evaluate', 'running');
      useAgentStore.getState().clearApiHistory();
      useAgentStore.getState().setIsEvaluating(true);

      let evalSuccess = false;
      try {
        await sendMessageRef.current('위 5개 주제를 평가해주세요.', 'evaluate', {
          noStepAdvance: true,
          silent: true,
          extraPayload: { topics: topics.map((t) => t.title) },
        });
        evalSuccess = useAgentStore.getState().evaluations.length > 0;
      } catch {
        evalSuccess = false;
      } finally {
        useAgentStore.getState().setIsEvaluating(false);
      }

      if (!evalSuccess) {
        useAgentStore.getState().setEvaluations([]);
        toast.error('SEO 평가 실패 — 수동 선택 모드로 전환합니다', { duration: 5000 });
        updateStep('evaluate', 'error', 'SEO 평가 실패');
        useAgentStore.getState().addMessage({
          role: 'agent',
          content: '📋 수동 선택 모드 — 위 주제 카드를 직접 클릭하여 원하는 주제를 선택해주세요.',
          type: 'text',
        });
        return;
      }
      updateStep('evaluate', 'done', 'SEO 평가 완료');

      // ── Step 3: 최적 주제 선택 ────────────────────
      updateStep('select', 'running');
      const evaluations = useAgentStore.getState().evaluations;
      const selected = evaluations.find((e) => e.selected) ?? evaluations[0];
      useAgentStore.getState().setSelectedTopic(selected);
      updateStep('select', 'done', `"${selected.title}" 선택됨`);

      // 3초 대기 — 사용자가 평가 결과 확인
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // ── Step 4: 초안 작성 ─────────────────────────
      updateStep('draft', 'running');
      useAgentStore.getState().clearApiHistory();
      useAgentStore.getState().setDraft(null);

      await sendMessageRef.current(
        `주제 "${selected.title}"로 블로그 방향성을 설정해주세요.`,
        'direction', { noStepAdvance: true }
      );
      await sendMessageRef.current(
        '이 방향으로 블로그 초안을 작성해주세요.',
        'draft', { noStepAdvance: true }
      );

      const draft = useAgentStore.getState().draft;
      if (!draft) {
        updateStep('draft', 'error', '초안 생성 실패');
        toast.error('초안 생성에 실패했습니다.', { duration: 5000 });
        return;
      }
      useAgentStore.getState().addDraft(draft);
      updateStep('draft', 'done', `${draft.word_count}자 초안 완성`);

      // ── Step 5: 이미지 프롬프트 생성 ──────────────
      updateStep('imagePrompts', 'running');
      useAgentStore.getState().clearApiHistory();

      let imagePromptsOk = false;
      try {
        await sendMessageRef.current('이미지 프롬프트를 생성해주세요.', 'imagePrompts', {
          noStepAdvance: true,
          silent: true,
          extraPayload: {
            content: draft.content,
            metaTitle: draft.meta_title,
            category: settings.categories[0] ?? '재테크',
          },
        });
        const imagePrompts = useAgentStore.getState().imagePrompts;
        imagePromptsOk = imagePrompts.length > 0;
        if (imagePromptsOk) {
          const contentCount = imagePrompts.filter((p) => p.type === 'content').length;
          updateStep('imagePrompts', 'done', `썸네일 1장 + 본문용 ${contentCount}장 프롬프트 생성`);
        }
      } catch {
        imagePromptsOk = false;
      }

      if (!imagePromptsOk) {
        updateStep('imagePrompts', 'error', '이미지 프롬프트 생성 실패');
        updateStep('images', 'error', '이미지 생성 건너뜀');
        useAgentStore.getState().setStep(4);
        toast.success('초안이 완성되었습니다! (이미지 생성 건너뜀)', { duration: 4000 });
        return;
      }

      // ── Step 6: 이미지 생성 ───────────────────────
      updateStep('images', 'running');
      useAgentStore.getState().setGeneratingImages(true);

      try {
        const imagePrompts = useAgentStore.getState().imagePrompts;
        const res = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePrompts }),
        });
        const data = await res.json();
        const images = data.images ?? [];
        useAgentStore.getState().setGeneratedImages(images);

        if (images.length > 0) {
          updateStep('images', 'done', `이미지 ${images.length}장 생성 완료`);
        } else {
          updateStep('images', 'error', '이미지 생성 실패 — 텍스트만 저장됨');
        }
      } catch {
        updateStep('images', 'error', '이미지 생성 실패 — 텍스트만 저장됨');
        toast.error('이미지 생성에 실패했습니다. 초안은 정상 완성되었습니다.', { duration: 4000 });
      } finally {
        useAgentStore.getState().setGeneratingImages(false);
      }

      // 완료 (이미지 실패해도 진행)
      useAgentStore.getState().setStep(4);
      toast.success('초안과 이미지가 완성되었습니다! 🎉', { duration: 4000 });
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

    if (state.autoMode && isFreshSession) {
      await runAutoPipeline(text);
      return;
    }

    let step: Step;
    if (state.currentStep === 1) step = 'topic';
    else if (state.currentStep === 2) step = 'direction';
    else if (state.currentStep === 3) step = /작성|써/.test(text) ? 'draft' : 'direction';
    else step = 'freeform';

    await sendMessage(text, step);
  }, [sendMessage, runAutoPipeline]);

  // ──────────────────────────────────────────────
  // 이미지 재생성 / 수동 이미지 생성
  // ──────────────────────────────────────────────

  const handleRegenerateImage = useCallback(async (promptIndex: number) => {
    const prompts = useAgentStore.getState().imagePrompts;
    const prompt = prompts[promptIndex];
    if (!prompt) return;

    useAgentStore.getState().setGeneratingImages(true);
    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompts: [prompt] }),
      });
      const data = await res.json();

      if (res.status === 400 && data.error?.includes('GEMINI_API_KEY')) {
        setImageError('GEMINI API 키가 설정되지 않았습니다. .env.local에 GEMINI_API_KEY를 추가해주세요.');
        return;
      }

      const [newImage] = data.images ?? [];
      if (!newImage) {
        toast.error('이미지 재생성에 실패했습니다. 다시 시도해주세요.', { duration: 4000 });
        return;
      }

      const prev = useAgentStore.getState().generatedImages;
      const idx = prev.findIndex(
        (img) => img.type === newImage.type && img.insertAfterSection === newImage.insertAfterSection
      );
      const updated = [...prev];
      if (idx >= 0) {
        updated[idx] = newImage;
      } else {
        updated.push(newImage);
      }
      useAgentStore.getState().setGeneratedImages(updated);
      toast.success('이미지가 재생성되었습니다! ✨', { duration: 2000 });
    } catch {
      toast.error('이미지 재생성에 실패했습니다. 다시 시도해주세요.', { duration: 4000 });
    } finally {
      useAgentStore.getState().setGeneratingImages(false);
    }
  }, []);

  const handleGenerateImages = useCallback(async () => {
    const state = useAgentStore.getState();
    const draft = state.drafts[0];
    if (!draft) return;

    setImageError(null);
    useAgentStore.getState().setGeneratingImages(true);
    try {
      state.clearApiHistory();
      await sendMessageRef.current('이미지 프롬프트를 생성해주세요.', 'imagePrompts', {
        noStepAdvance: true,
        silent: true,
        extraPayload: {
          content: draft.content,
          metaTitle: draft.meta_title,
          category: state.settings.categories[0] ?? '재테크',
        },
      });

      const prompts = useAgentStore.getState().imagePrompts;
      if (prompts.length === 0) {
        toast.error('이미지 프롬프트 생성에 실패했습니다.', { duration: 4000 });
        return;
      }

      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompts: prompts }),
      });
      const data = await res.json();

      if (res.status === 400 && data.error?.includes('GEMINI_API_KEY')) {
        setImageError('GEMINI API 키가 설정되지 않았습니다. .env.local에 GEMINI_API_KEY를 추가해주세요.');
        return;
      }

      const images = data.images ?? [];
      useAgentStore.getState().setGeneratedImages(images);

      if (images.length > 0) {
        toast.success(`이미지 ${images.length}장이 생성되었습니다! 🎉`, { duration: 3000 });
      } else {
        toast.error('이미지 생성에 실패했습니다.', { duration: 4000 });
      }
    } catch {
      toast.error('이미지 생성 중 오류가 발생했습니다.', { duration: 4000 });
    } finally {
      useAgentStore.getState().setGeneratingImages(false);
    }
  }, []);

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
    setPipelineSteps(INITIAL_PIPELINE_STEPS);
    setImageError(null);
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

        {drafts.length >= 1 ? (
          imagePrompts.length > 0 || isGeneratingImages ? (
            // 자동 파이프라인 결과: 이미지 포함 DraftBox
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <DraftBox
                draft={drafts[0]}
                generatedImages={generatedImages}
                isGeneratingImages={isGeneratingImages}
                imagePrompts={imagePrompts}
                imageError={imageError ?? undefined}
                onCopy={() => {}}
                onRevise={() => handleRewrite(0)}
                onReset={handleReset}
                onSaveToNotes={() => {}}
                onRegenerateImage={handleRegenerateImage}
                onGenerateImages={handleGenerateImages}
              />
            </div>
          ) : (
            // 수동 모드 또는 이미지 없는 결과: 기존 DualDraftBox
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
          )
        ) : (
          <MessageList streamingText={streamingText} />
        )}

        {/* 파이프라인 진행 상태 */}
        <PipelineStatus steps={pipelineSteps} />

        {/* 빠른 시작 버튼 */}
        {showWelcomeActions && (
          <div style={{
            flexShrink: 0, padding: '0 16px 10px',
            display: 'flex', gap: '8px', flexWrap: 'wrap',
          }}>
            <QuickButton
              onClick={() => runAutoPipeline('요즘 인기 있는 재테크 주제 추천해줘')}
              color="#e6b84a"
            >
              🚀 자동 완성
            </QuickButton>
            <QuickButton
              onClick={() => document.querySelector<HTMLTextAreaElement>('textarea')?.focus()}
              color="#484f58"
            >
              ✏️ 직접 입력
            </QuickButton>
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
