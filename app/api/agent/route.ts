import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { Settings } from '@/lib/types';
import {
  getTopicPrompt,
  getDirectionPrompt,
  getDraftPrompt,
  getFreeformPrompt,
  getEvaluatePrompt,
} from '@/lib/prompts';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Step = 'topic' | 'evaluate' | 'direction' | 'draft' | 'freeform';

interface RequestBody {
  step: Step;
  userMessage: string;
  topics?: string[];
  categories?: string[];
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

  const { step, userMessage, topics, categories, history, settings } = body;

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

  // 3. 시스템 프롬프트 선택
  const systemPrompt: string = (() => {
    switch (step) {
      case 'topic':     return getTopicPrompt(settings);
      case 'evaluate':  return getEvaluatePrompt(topics ?? [], categories ?? settings?.categories ?? []);
      case 'direction': return getDirectionPrompt(settings);
      case 'draft':     return getDraftPrompt(settings);
      case 'freeform':  return getFreeformPrompt();
      default:          return getFreeformPrompt();
    }
  })();

  // 4. web_search 도구 조건부 포함
  const useWebSearch =
    settings.useSearch && (step === 'topic' || step === 'draft');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = useWebSearch
    ? [{ type: 'web_search_20250305', name: 'web_search' }]
    : [];

  // 5. Anthropic 클라이언트 초기화
  const client = new Anthropic({ apiKey });

  // 6. 스트리밍 응답 생성
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const tokenMap: Record<string, number> = { topic: 3000, evaluate: 1500, direction: 4000, draft: 8192, freeform: 4000 };
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

        // tools가 있을 때만 추가 (타입 에러 방지)
        if (tools.length > 0) {
          (requestParams as Record<string, unknown>).tools = tools;
        }

        const streamResponse = client.messages.stream(requestParams);

        // 텍스트 델타 스트리밍
        streamResponse.on('text', (textDelta) => {
          try {
            controller.enqueue(
              encode({ type: 'delta', text: textDelta })
            );
          } catch {
            // controller already closed
          }
        });

        // 최종 메시지 수신 시 완료 이벤트
        streamResponse.on('finalMessage', () => {
          try {
            controller.enqueue(encode({ type: 'done', step }));
            controller.close();
          } catch {
            // already closed
          }
        });

        // 스트림 에러
        streamResponse.on('error', (err: Error) => {
          const message = parseAnthropicError(err);
          try {
            controller.enqueue(encode({ type: 'error', message }));
            controller.close();
          } catch {
            // already closed
          }
        });

        // 스트림이 끝날 때까지 대기
        await streamResponse.finalMessage();
      } catch (err: unknown) {
        const message = parseAnthropicError(err instanceof Error ? err : new Error(String(err)));
        try {
          controller.enqueue(encode({ type: 'error', message }));
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
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
