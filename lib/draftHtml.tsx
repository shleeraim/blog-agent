'use client';

import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { buildToc, type TocEntry } from '@/lib/utils';

// 본문 마크다운 → 티스토리 HTML 모드에 그대로 붙여넣을 수 있는 HTML 문자열로 변환.
// h2/h3 태그는 일단 id 없이 렌더링한 뒤, buildToc()가 만든 동일한 entries 순서대로
// id를 주입한다 — 목차 링크(href)와 헤딩 id가 같은 데이터 소스를 쓰므로 절대 어긋나지 않는다.
function markdownBodyToHtml(content: string, entries: TocEntry[]): string {
  const rawHtml = renderToStaticMarkup(
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: '19px', fontWeight: 700, margin: '28px 0 10px' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '20px 0 8px' }}>{children}</h3>,
        p: ({ children }) => <p style={{ margin: '0 0 14px', lineHeight: 1.8 }}>{children}</p>,
        strong: ({ children }) => <strong>{children}</strong>,
        ul: ({ children }) => <ul style={{ margin: '0 0 14px', paddingLeft: '22px' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: '0 0 14px', paddingLeft: '22px' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '6px', lineHeight: 1.8 }}>{children}</li>,
        code: ({ children }) => (
          <code style={{ background: '#f1f1f1', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{children}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: '3px solid #ccc', margin: '14px 0', padding: '4px 0 4px 14px', color: '#666' }}>{children}</blockquote>
        ),
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
        table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 14px' }}>{children}</table>,
        th: ({ children }) => <th style={{ border: '1px solid #ddd', padding: '8px 10px', background: '#f6f6f6', textAlign: 'left' }}>{children}</th>,
        td: ({ children }) => <td style={{ border: '1px solid #ddd', padding: '8px 10px' }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );

  // <h2 ...>, <h3 ...> 태그를 등장 순서대로 entries와 짝지어 id 주입
  const queue = [...entries];
  return rawHtml.replace(/<(h2|h3)(\s|>)/g, (match, tag: 'h2' | 'h3', tail: string) => {
    const wantLevel = tag === 'h2' ? 2 : 3;
    const next = queue[0]?.level === wantLevel ? queue.shift() : undefined;
    if (!next) return match;
    return tail === '>' ? `<${tag} id="${next.slug}">` : `<${tag} id="${next.slug}" `;
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 목차를 HTML로 직렬화 — 어떤 블로그 테마(라이트/다크)에도 무난한 중립 색상 사용
function tocEntriesToHtml(entries: TocEntry[]): string {
  const items = entries.map((e) => {
    const num = e.level === 2 ? `${e.h2Index}.` : `${e.h2Index}.${e.h3Index}`;
    const indent = e.level === 3 ? '16px' : '0';
    const size = e.level === 3 ? '13px' : '14px';
    return (
      `<div style="padding-left:${indent};margin-bottom:6px;font-size:${size};line-height:1.6;">` +
      `<a href="#${e.slug}" style="color:#333;text-decoration:none;">` +
      `<span style="color:#888;font-family:monospace;margin-right:6px;">${num}</span>${escapeHtml(e.text)}` +
      `</a></div>`
    );
  }).join('');

  return (
    `<div style="border:1px solid #ddd;border-radius:8px;padding:14px 16px;margin:0 0 20px;background:#fafafa;">` +
    `<div style="font-size:12px;font-weight:700;color:#888;letter-spacing:0.05em;margin-bottom:10px;">목차</div>` +
    items +
    `</div>`
  );
}

// "HTML 복사" 버튼에 쓰는 최종 문자열 — 목차(앵커 링크) + id가 매겨진 본문
export function draftToHtml(content: string): string {
  const entries = buildToc(content);
  const body = markdownBodyToHtml(content, entries);
  if (entries.length < 2) return body;
  return tocEntriesToHtml(entries) + body;
}
