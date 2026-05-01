import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

// Vercel 함수 최대 실행 시간 (Hobby: 최대 60초)
export const maxDuration = 60;
import type { Settings } from '@/lib/types';
import {
  getTopicPrompt,
  getDirectionPrompt,
  getDraftPrompt,
  getFreeformPrompt,
  getEvaluatePrompt,
  getImagePromptsPrompt,
} from '@/lib/prompts';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Step = 'topic' | 'evaluate' | 'direction' | 'draft' | 'imagePrompts' | 'freeform';

interface RequestBody {
  step: Step;
  userMessage: string;
  // evaluate 전용
  topics?: string[];
  // imagePrompts 전용
  content?: string;
  metaTitle?: string;
  category?: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  settings: Settings;
}

// SSE 헬퍼
function encode(obj: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

// ──────────────────────────────────────────────
// POST /api/agent
// ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. 요청 파싱
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { step, userMessage, topics, content, metaTitle, category, history, settings } = body;

  // 2. 환경 변수 확인
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === '여기에_키_입력') {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encode({
            type: 'error',
            message: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.',
          })
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const client = new Anthropic({ apiKey });

  // ── 3a. evaluate / imagePrompts: 실시간 스트리밍 (비스트리밍은 Vercel 504 유발) ─────
  if (step === 'evaluate' || step === 'imagePrompts') {
    const tokenMap: Record<string, number> = { evaluate: 3000, imagePrompts: 1000 };
    const maxTokens = tokenMap[step];

    const systemPrompt =
      step === 'evaluate'
        ? getEvaluatePrompt(topics ?? [])
        : getImagePromptsPrompt(content ?? '', metaTitle ?? '', category ?? '재테크');

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamResponse = client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          });

          streamResponse.on('text', (textDelta) => {
            try {
              controller.enqueue(encode({ type: 'delta', text: textDelta }));
            } catch { /* already closed */ }
          });

          streamResponse.on('error', (err: Error) => {
            const message = parseAnthropicError(err);
            try {
              controller.enqueue(encode({ type: 'error', message }));
              controller.close();
            } catch { /* already closed */ }
          });

          await streamResponse.finalMessage();
          try {
            controller.enqueue(encode({ type: 'done', step }));
            controller.close();
          } catch { /* already closed */ }
        } catch (err: unknown) {
          const message = parseAnthropicError(err instanceof Error ? err : new Error(String(err)));
          try {
            controller.enqueue(encode({ type: 'error', message }));
            controller.close();
          } catch { /* already closed */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // ── 3b. 나머지 step: 스트리밍 ───────────────────────────────────────
  const systemPrompt: string = (() => {
    switch (step) {
      case 'topic':     return getTopicPrompt(settings);
      case 'direction': return getDirectionPrompt(settings);
      case 'draft':     return getDraftPrompt(settings);
      case 'freeform':  return getFreeformPrompt();
      default:          return getFreeformPrompt();
    }
  })();

  // web_search 도구: topic step에만 포함 (draft에서 실제 검색 실행 시 스트림 타임아웃 발생)
  const useWebSearch = settings.useSearch && step === 'topic';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = useWebSearch ? [{ type: 'web_search_20250305', name: 'web_search' }] : [];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const tokenMap: Record<string, number> = { topic: 3000, direction: 4000, draft: 8192, freeform: 4000 };
        const maxTokens = tokenMap[step] ?? 4000;

        const requestParams: Parameters<typeof client.messages.stream>[0] = {
          model: 'claude-sonnet-4-6',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [
            ...history.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ],
        };

        if (tools.length > 0) {
          (requestParams as Record<string, unknown>).tools = tools;
        }

        const streamResponse = client.messages.stream(requestParams);

        streamResponse.on('text', (textDelta) => {
          try {
            controller.enqueue(encode({ type: 'delta', text: textDelta }));
          } catch { /* controller already closed */ }
        });

        streamResponse.on('finalMessage', () => {
          try {
            controller.enqueue(encode({ type: 'done', step }));
            controller.close();
          } catch { /* already closed */ }
        });

        streamResponse.on('error', (err: Error) => {
          const message = parseAnthropicError(err);
          try {
            controller.enqueue(encode({ type: 'error', message }));
            controller.close();
          } catch { /* already closed */ }
        });

        await streamResponse.finalMessage();
      } catch (err: unknown) {
        const message = parseAnthropicError(err instanceof Error ? err : new Error(String(err)));
        try {
          controller.enqueue(encode({ type: 'error', message }));
          controller.close();
        } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ──────────────────────────────────────────────
// 에러 파싱 헬퍼
// ──────────────────────────────────────────────

function parseAnthropicError(err: Error): string {
  const msg = err.message ?? '';

  // API 키 오류
  if (msg.includes('401') || msg.includes('authentication')) {
    return 'API 키가 올바르지 않습니다. .env.local의 ANTHROPIC_API_KEY를 확인해주세요.';
  }
  // Rate limit
  if (msg.includes('429') || msg.includes('rate_limit')) {
    return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
  }
  // 타임아웃
  if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
    return '요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';
  }
  // JSON 파싱 불가 (모델이 잘못된 응답 반환)
  if (msg.includes('JSON') || msg.includes('parse')) {
    return '모델 응답을 파싱할 수 없습니다. 다시 시도해주세요.';
  }
  // 서버 오류
  if (msg.includes('500') || msg.includes('overloaded')) {
    return 'Anthropic 서버에 일시적인 오류가 발생했습니다. 잠시 후 재시도해주세요.';
  }

  return `오류가 발생했습니다: ${msg || '알 수 없는 오류'}`;
}
