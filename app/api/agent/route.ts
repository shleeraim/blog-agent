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

// Edge Runtime: 스트리밍 응답 중 타임아웃 없음 (Hobby 포함)
export const runtime = 'edge';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Step = 'topic' | 'evaluate' | 'direction' | 'draft' | 'freeform';

interface RequestBody {
  step: Step;
  userMessage: string;
  topics?: string[];
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
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { step, userMessage, topics, history, settings } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === '여기에_키_입력') {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encode({ type: 'error', message: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.' })
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  }

  const client = new Anthropic({ apiKey });

  // ── 파라미터 결정 ────────────────────────────────
  const tokenMap: Record<string, number> = {
    evaluate: 3000,
    topic: 3000, direction: 6000, draft: 16000, freeform: 4000,
  };
  const maxTokens = tokenMap[step] ?? 4000;

  let systemPrompt: string;
  let apiMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestTools: any[] = [];

  if (step === 'evaluate') {
    systemPrompt = getEvaluatePrompt(topics ?? []);
    apiMessages = [{ role: 'user', content: userMessage }];
  } else {
    switch (step) {
      case 'topic':     systemPrompt = getTopicPrompt(settings);     break;
      case 'direction': systemPrompt = getDirectionPrompt(settings); break;
      case 'draft':     systemPrompt = getDraftPrompt(settings);     break;
      default:          systemPrompt = getFreeformPrompt();
    }
    apiMessages = [
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userMessage },
    ];
    // web_search: topic step에만 (draft에서 사용 시 타임아웃 유발)
    if (settings.useSearch && step === 'topic') {
      requestTools.push({ type: 'web_search_20250305', name: 'web_search' });
    }
  }

  // ── 스트리밍 (async iterator — Edge Runtime 호환) ─
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
          model: 'claude-sonnet-4-6',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: apiMessages,
          stream: true,
        };
        if (requestTools.length > 0) params.tools = requestTools;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiStream: AsyncIterable<any> = await (client.messages as any).create(params);

        for await (const event of apiStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta' &&
            typeof event.delta.text === 'string'
          ) {
            try {
              controller.enqueue(encode({ type: 'delta', text: event.delta.text }));
            } catch { /* already closed */ }
          }

          if (event.type === 'message_stop') {
            try {
              controller.enqueue(encode({ type: 'done', step }));
              controller.close();
            } catch { /* already closed */ }
          }
        }
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
  if (msg.includes('401') || msg.includes('authentication'))
    return 'API 키가 올바르지 않습니다. .env.local의 ANTHROPIC_API_KEY를 확인해주세요.';
  if (msg.includes('429') || msg.includes('rate_limit'))
    return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
  if (msg.includes('timeout') || msg.includes('ETIMEDOUT'))
    return '요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';
  if (msg.includes('JSON') || msg.includes('parse'))
    return '모델 응답을 파싱할 수 없습니다. 다시 시도해주세요.';
  if (msg.includes('500') || msg.includes('overloaded'))
    return 'Anthropic 서버에 일시적인 오류가 발생했습니다. 잠시 후 재시도해주세요.';
  return `오류가 발생했습니다: ${msg || '알 수 없는 오류'}`;
}
