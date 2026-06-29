import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Table of Contents ─────────────────────────────

export interface TocEntry {
  level: 2 | 3;
  text: string;
  h2Index: number;
  h3Index: number;
  slug: string;
}

export function buildToc(content: string): TocEntry[] {
  const entries: TocEntry[] = [];
  let h2Count = 0;
  let h3Count = 0;

  for (const line of content.split('\n')) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) {
      h2Count++;
      h3Count = 0;
      entries.push({ level: 2, text: h2[1].trim(), h2Index: h2Count, h3Index: 0, slug: `toc-${h2Count}` });
    } else if (h3) {
      h3Count++;
      entries.push({ level: 3, text: h3[1].trim(), h2Index: h2Count, h3Index: h3Count, slug: `toc-${h2Count}-${h3Count}` });
    }
  }
  return entries;
}

// 헤딩 줄 바로 위에 <a id="toc-x"> 앵커를 심어, 복사한 마크다운에서도 목차 링크가 실제로 동작하게 함
// (slug 규칙은 buildToc()와 동일하게 유지해야 함)
function injectTocAnchors(content: string): string {
  const out: string[] = [];
  let h2Count = 0;
  let h3Count = 0;

  for (const line of content.split('\n')) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) {
      h2Count++;
      h3Count = 0;
      out.push(`<a id="toc-${h2Count}"></a>`);
    } else if (h3) {
      h3Count++;
      out.push(`<a id="toc-${h2Count}-${h3Count}"></a>`);
    }
    out.push(line);
  }
  return out.join('\n');
}

function buildTocMarkdown(entries: TocEntry[]): string {
  const lines = entries.map((e) => {
    const num = e.level === 2 ? `${e.h2Index}.` : `${e.h2Index}.${e.h3Index}`;
    const indent = e.level === 3 ? '    ' : '';
    return `${indent}- [${num} ${e.text}](#${e.slug})`;
  });
  return `**목차**\n\n${lines.join('\n')}`;
}

// "텍스트/마크다운 복사" 버튼에 쓰는 최종 문자열 — 목차(앵커 링크) + 앵커가 심긴 본문
export function buildCopyMarkdown(content: string): string {
  const entries = buildToc(content);
  if (entries.length < 2) return content;
  return `${buildTocMarkdown(entries)}\n\n${injectTocAnchors(content)}`;
}

// HTML 클립보드 복사 — 서식 있는 에디터에는 text/html로, 텍스트 입력창(티스토리
// HTML/마크다운 소스 모드 등)에는 text/plain으로 들어가는데, 이때도 "HTML 태그
// 문자열 그대로"가 들어가야 한다. 여기에 마크다운을 넣으면 HTML 소스 입력창에
// 마크다운 문법이 그대로 박혀버려서 깨진다 — 두 MIME 모두 같은 html을 채운다.
export async function copyAsHtml(html: string): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([html], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
  } else {
    await navigator.clipboard.writeText(html);
  }
}

export function extractJson(text: string): string {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON found in response');

  // Build output char-by-char so we can repair literal control chars inside strings.
  // LLMs sometimes emit raw newlines (code 10) instead of the JSON escape \n, which
  // causes JSON.parse to throw "Unterminated string". We fix that here.
  let depth = 0;
  let inString = false;
  let escaped = false;
  const chars: string[] = [];

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);

    if (escaped) { escaped = false; chars.push(ch); continue; }

    if (inString) {
      if (ch === '\\') { escaped = true; chars.push(ch); continue; }
      if (ch === '"')  { inString = false; chars.push(ch); continue; }
      // Replace literal control characters with valid JSON escapes
      if (code === 10) { chars.push('\\n'); continue; }
      if (code === 13) { chars.push('\\r'); continue; }
      if (code === 9)  { chars.push('\\t'); continue; }
      chars.push(ch);
      continue;
    }

    if (ch === '"') { inString = true; chars.push(ch); continue; }
    if (ch === '{') { depth++; chars.push(ch); continue; }
    if (ch === '}') {
      depth--;
      chars.push(ch);
      if (depth === 0) {
        // Remove trailing commas before ] or } — common LLM output issue
        return chars.join('').replace(/,(\s*[}\]])/g, '$1');
      }
      continue;
    }
    chars.push(ch);
  }

  throw new Error('Incomplete JSON object in response');
}
