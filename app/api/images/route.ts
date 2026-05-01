import { NextRequest } from 'next/server';
import { generateImagesForDraft } from '@/lib/image/gemini-image';
import type { ImagePrompt } from '@/lib/types';

export async function POST(req: NextRequest) {
  let body: { imagePrompts: ImagePrompt[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === '여기에_입력') {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY가 설정되지 않았습니다' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { imagePrompts } = body;
  if (!Array.isArray(imagePrompts) || imagePrompts.length === 0) {
    return new Response(JSON.stringify({ error: 'imagePrompts is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const images = await generateImagesForDraft(imagePrompts);
    const failedCount = imagePrompts.length - images.length;

    if (images.length === 0) {
      return new Response(
        JSON.stringify({ error: '모든 이미지 생성에 실패했습니다.', failedCount }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ images, failedCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
