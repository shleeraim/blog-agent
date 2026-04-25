'use client';

import { useCallback, useRef } from 'react';
import { useAgentStore } from '@/lib/store';
import type { Step, TopicResult, DirectionResult, DraftResult } from '@/lib/types';

function extractJson(text: string): string {
  // 1순위: ```json ... ``` 코드블록에서 추출
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (blockMatch?.[1]?.trim().startsWith('{')) {
    return blockMatch[1].trim();
  }
  // 2순위: 첫 { 와 마지막 } 사이에서 추출
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

export function useChat({
  onStreamStart,
  onStreamDelta,
  onStreamEnd,
  onParseError,
}: UseChatOptions = {}) {
  const {
    addMessage,
    addApiHistory,
    settings,
    setTopics,
    setDirection,
    setDraft,
    setStep,
    isLoading,
    setLoading,
    apiHistory,
  } = useAgentStore();

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string, step: Step) => {
      if (isLoading) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      addMessage({ role: 'user', content: userMessage });
      addApiHistory('user', userMessage);
      setLoading(true);
      onStreamStart?.();

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
                onStreamDelta?.(event.text);
              } else if (event.type === 'done') {
                if (step === 'freeform') {
                  addMessage({ role: 'agent', content: accumulated, type: 'text' });
                  addApiHistory('assistant', accumulated);
                } else {
                  try {
                    const parsed = JSON.parse(extractJson(accumulated));
                    if (step === 'topic') {
                      const result = parsed as TopicResult;
                      setTopics(result.topics);
                      addMessage({ role: 'agent', content: result.intro, type: 'topics', data: result });
                      setStep(2);
                    } else if (step === 'direction') {
                      const result = parsed as DirectionResult;
                      setDirection(result);
                      addMessage({ role: 'agent', content: result.summary, type: 'direction', data: result });
                      setStep(3);
                    } else if (step === 'draft') {
                      const result = parsed as DraftResult;
                      setDraft(result);
                      addMessage({ role: 'agent', content: result.meta_title, type: 'draft', data: result });
                      setStep(4);
                    }
                    addApiHistory('assistant', accumulated);
                  } catch {
                    // JSON 파싱 실패 → 재시도 가능한 에러 메시지
                    addMessage({
                      role: 'agent',
                      content: '응답 파싱에 실패했습니다.',
                      type: 'error',
                      data: {
                        errorMessage: '응답 파싱에 실패했습니다. 다시 시도해 주세요.',
                        retryMessage: userMessage,
                        retryStep: step,
                      },
                    });
                    onParseError?.();
                  }
                }
                onStreamEnd?.();
              } else if (event.type === 'error') {
                addMessage({ role: 'agent', content: `⚠️ ${event.message}`, type: 'text' });
                onStreamEnd?.();
              }
            } catch {
              // SSE 이벤트 파싱 실패 무시
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        addMessage({ role: 'agent', content: `⚠️ ${message}`, type: 'text' });
        onStreamEnd?.();
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, apiHistory, settings]
  );

  return { sendMessage, isLoading };
}
