import { NextRequest } from 'next/server';
import { saveToAppleNotes } from '@/lib/notes/apple-notes';
import type { DraftResult } from '@/lib/types';

interface RequestBody {
  draft: DraftResult;
  seoScore?: number;
  searchVolume?: number;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { draft, seoScore = 0, searchVolume = 0 } = body;

  if (!draft?.meta_title || !draft?.content) {
    return Response.json({ error: 'draft.meta_title and draft.content are required' }, { status: 400 });
  }

  const now = new Date();
  const date = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\. /g, '-').replace('.', ''); // YYYY-MM-DD

  const createdAt = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });

  const result = await saveToAppleNotes({
    date,
    drafts: [
      {
        title: draft.meta_title,
        metaDesc: draft.meta_desc ?? '',
        tags: draft.tags ?? [],
        content: draft.content,
        seoScore,
        searchVolume,
        createdAt,
      },
    ],
  });

  return Response.json(result);
}
