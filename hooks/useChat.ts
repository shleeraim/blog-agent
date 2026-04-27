'use client';

import { useCallback, useRef } from 'react';
import { useAgentStore } from '@/lib/store';
import type { Step, TopicResult, DirectionResult, DraftResult } from '@/lib/types';

function extractJson(text: string): string {
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (blockMatch?.[1]?.trim().startsWith('{')) {
    return blockMatch[1].trim();
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  throw new Error('No JSON found in response');
}

interface UseChatOptions {
  onStreamStart?: () => void;
  onStreamDelta?: (text: string) => void;
  onStreamEnd?: () => void;
  onParseError?: () => void;
}

export interface SendOptions {
  // 스텝 자동 전진 억제 (파이프라인 모드에서 사용)
  noStepAdvance?: boolean;
  // 유저 메시지 말풍선 숨기기
  silent?: boolean;
}

export function useChat({
  onStreamStart,
  onStreamDelta,
  onStreamEnd,
  onParseError,
}: UseChatOptions = {}) {
  // 렌더링마다 최신 콜백을 ref에 동기화
  const cbRef = useRef({ onStreamStart, onStreamDelta, onStreamEnd, onParseError });
  cbRef.current = { onStreamStart, onStreamDelta, onStreamEnd, onParseError };

  const abortRef = useRef<AbortController | null>(null);

  // sendMessage는 안정적인 참조 ([]). 내부에서 getState()로 항상 최신 상태를 읽음
  const sendMessage = useCallback(
    async (userMessage: string, step: Step, options?: SendOptions) => {
      // ── 1. 현재 스냅샷 (호출 시점 최신 상태) ──
      const snap = useAgentStore.getState();
      if (snap.isLoading) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // apiHistory: 현재 메시지를 포함하기 전의 이전 대화 기록
      const { apiHistory, settings } = snap;

      if (!options?.silent) {
        snap.addMessage({ role: 'user', content: userMessage });
      }
      snap.addApiHistory('user', userMessage);
      snap.setLoading(true);
      cbRef.current.onStreamStart?.();

      let accumulated = '';

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step, userMessage, history: apiHistory, settings }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'delta') {
                accumulated += event.text;
                cbRef.current.onStreamDelta?.(event.text);
              } else if (event.type === 'done') {
                const st = useAgentStore.getState();
                if (step === 'freeform') {
                  st.addMessage({ role: 'agent', content: accumulated, type: 'text' });
                  st.addApiHistory('assistant', accumulated);
                } else {
                  try {
                    const parsed = JSON.parse(extractJson(accumulated));
                    if (step === 'topic') {
                      const result = parsed as TopicResult;
                      st.setTopics(result.topics);
                      st.addMessage({ role: 'agent', content: result.intro, type: 'topics', data: result });
                      if (!options?.noStepAdvance) st.setStep(2);
                    } else if (step === 'direction') {
                      const result = parsed as DirectionResult;
                      st.setDirection(result);
                      st.addMessage({ role: 'agent', content: result.summary, type: 'direction', data: result });
                      if (!options?.noStepAdvance) st.setStep(3);
                    } else if (step === 'draft') {
                      const result = parsed as DraftResult;
                      st.setDraft(result);
                      st.addMessage({ role: 'agent', content: result.meta_title, type: 'draft', data: result });
                      if (!options?.noStepAdvance) st.setStep(4);
                    }
                    st.addApiHistory('assistant', accumulated);
                  } catch {
                    st.addMessage({
                      role: 'agent',
                      content: '응답 파싱에 실패했습니다.',
                      type: 'error',
                      data: {
                        errorMessage: '응답 파싱에 실패했습니다. 다시 시도해 주세요.',
                        retryMessage: userMessage,
                        retryStep: step,
                      },
                    });
                    cbRef.current.onParseError?.();
                  }
                }
                cbRef.current.onStreamEnd?.();
              } else if (event.type === 'error') {
                useAgentStore.getState().addMessage({ role: 'agent', content: `⚠️ ${event.message}`, type: 'text' });
                cbRef.current.onStreamEnd?.();
              }
            } catch {
              // SSE 이벤트 파싱 실패 무시
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        useAgentStore.getState().addMessage({ role: 'agent', content: `⚠️ ${message}`, type: 'text' });
        cbRef.current.onStreamEnd?.();
      } finally {
        useAgentStore.getState().setLoading(false);
      }
    },
    [] // getState() 패턴 — 의존성 없이 항상 최신 상태를 읽음
  );

  // isLoading은 렌더링용으로 별도 구독
  const { isLoading } = useAgentStore();

  return { sendMessage, isLoading };
}
