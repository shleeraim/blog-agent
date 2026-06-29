'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import type { DraftResult } from '@/lib/types';
import { buildToc, buildCopyMarkdown, copyAsHtml, type TocEntry } from '@/lib/utils';
import { draftToHtml } from '@/lib/draftHtml';

// ── Types ───────────────────────────────────────

interface DraftBoxProps {
  draft: DraftResult;
  onCopy: () => void;
  onRevise: () => void;
  onReset: () => void;
}

// ── Publish Checklist ───────────────────────────

interface CheckItem {
  label: string;
  pass: boolean;
  detail: string;
}

function buildChecklist(draft: DraftResult): CheckItem[] {
  const titleLen = draft.meta_title.length;
  const cleanTags = (draft.tags ?? []).map((t) => t.replace(/^#+/, ''));
  const hasTagHash = (draft.tags ?? []).some((t) => t.startsWith('#'));
  const tagCount = cleanTags.length;
  const internalLinkCount = (draft.content.match(/(?<!!)\[[^\]]+\]\([^)]+\)/g) ?? []).length;
  const charCount = draft.content.length;
  const hasClosing =
    draft.content.includes('구독과 즐겨찾기') || draft.content.includes('관련 글 보기');

  return [
    {
      label: '제목 길이 35~50자',
      pass: titleLen >= 35 && titleLen <= 50,
      detail: `현재 ${titleLen}자`,
    },
    {
      label: '태그 # 없음',
      pass: !hasTagHash,
      detail: hasTagHash ? '태그에 # 포함됨 (자동 제거됨)' : '정상',
    },
    {
      label: '태그 수 5~8개',
      pass: tagCount >= 5 && tagCount <= 8,
      detail: `현재 ${tagCount}개`,
    },
    {
      label: '카테고리 지정',
      pass: !!draft.category && draft.category !== '카테고리 없음',
      detail: draft.category || '미지정',
    },
    {
      label: '내부 링크 2개 이상',
      pass: internalLinkCount >= 2,
      detail: `${internalLinkCount}개 감지`,
    },
    {
      label: '본문 1,500자 이상',
      pass: charCount >= 1500,
      detail: `현재 ${charCount.toLocaleString()}자`,
    },
    {
      label: '마무리 섹션 포함',
      pass: hasClosing,
      detail: hasClosing ? '포함됨' : '미포함',
    },
  ];
}

function PublishChecklist({ draft }: { draft: DraftResult }) {
  const [open, setOpen] = useState(false);
  const items = buildChecklist(draft);
  const failCount = items.filter((i) => !i.pass).length;
  const allPass = failCount === 0;

  return (
    <div style={{ border: `1px solid ${allPass ? '#56d36433' : '#d2992233'}`, borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: allPass ? '#56d36410' : '#d2992210',
          border: 'none', cursor: 'pointer', gap: '8px',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: allPass ? '#56d364' : '#d29922', fontFamily: "'DM Mono', monospace" }}>
          {allPass ? '✅ 발행 준비 완료' : `⚠️ ${failCount}개 항목 미충족`}
        </span>
        <span style={{ fontSize: '10px', color: '#484f58' }}>{open ? '▲ 접기' : '▼ 체크리스트 보기'}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 12px', background: '#161b22', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {items.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <span style={{ width: '14px', textAlign: 'center', flexShrink: 0 }}>
                {item.pass ? '✓' : '✗'}
              </span>
              <span style={{ color: item.pass ? '#8b949e' : '#e6edf3', flex: 1 }}>{item.label}</span>
              <span style={{ color: item.pass ? '#484f58' : '#d29922', fontFamily: "'DM Mono', monospace", fontSize: '10px' }}>
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Table of Contents ───────────────────────────

function TableOfContents({ content }: { content: string }) {
  const entries = buildToc(content);
  if (entries.length < 2) return null;

  return (
    <div style={{
      padding: '14px 16px', background: '#161b22',
      border: '1px solid #30363d', borderRadius: '8px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: '#8b949e',
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.08em', marginBottom: '10px',
      }}>
        목차
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {entries.map((entry, i) => (
          <li
            key={i}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              paddingLeft: entry.level === 3 ? '16px' : '0',
              fontSize: entry.level === 3 ? '11px' : '12px',
              color: entry.level === 3 ? '#8b949e' : '#c9d1d9',
              lineHeight: 1.5,
            }}
          >
            <span style={{
              flexShrink: 0, color: '#484f58', fontSize: '10px', marginTop: '2px',
            }}>·</span>
            <span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                color: entry.level === 3 ? '#484f58' : '#8b949e',
                marginRight: '6px', fontSize: '10px',
              }}>
                {entry.level === 2
                  ? `${entry.h2Index}.`
                  : `${entry.h2Index}.${entry.h3Index}`}
              </span>
              {entry.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Component ──────────────────────────────

export function DraftBox({
  draft,
  onCopy,
  onRevise,
  onReset,
}: DraftBoxProps) {
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildCopyMarkdown(draft.content));
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyHtml = async () => {
    await copyAsHtml(draftToHtml(draft.content), buildCopyMarkdown(draft.content));
    setCopiedHtml(true);
    onCopy();
    setTimeout(() => setCopiedHtml(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', background: '#1c2330', border: '1px solid #30363d', borderRadius: '12px' }}>

      {/* 상단: 뱃지 + 카테고리 + 메타 제목 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '20px',
            background: '#56d36422', border: '1px solid #56d36444',
            fontSize: '11px', color: '#56d364', fontWeight: 600,
            fontFamily: "'DM Mono', monospace",
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#56d364', display: 'inline-block' }} />
            DRAFT COMPLETE
          </div>
          {draft.category && (
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: '20px',
              background: '#388bfd18', border: '1px solid #388bfd44',
              fontSize: '11px', color: '#388bfd', fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
            }}>
              📂 {draft.category}
            </div>
          )}
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e6edf3', lineHeight: 1.45, fontFamily: "'Noto Serif KR', serif" }}>
          {draft.meta_title}
        </h2>
      </div>

      {/* 태그 배지 (# 방어 처리) */}
      {draft.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {draft.tags.map((tag) => {
            const cleanTag = tag.replace(/^#+/, '');
            return (
              <span key={cleanTag} style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: '#e6b84a18', border: '1px solid #e6b84a55', color: '#e6b84a' }}>
                #{cleanTag}
              </span>
            );
          })}
        </div>
      )}

      {/* 발행 전 체크리스트 */}
      <PublishChecklist draft={draft} />

      {/* 목차 */}
      <TableOfContents content={draft.content} />

      {/* 본문 마크다운 */}
      <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', fontSize: '13px', color: '#e6edf3', lineHeight: 1.85 }}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '20px', color: '#e6edf3', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', color: '#e6b84a', fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: '14px', color: '#c9d1d9', fontWeight: 600, marginTop: '14px', marginBottom: '6px' }}>{children}</h3>,
            p: ({ children }) => <p style={{ marginBottom: '10px', color: '#c9d1d9' }}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: '#e6edf3', fontWeight: 700 }}>{children}</strong>,
            ul: ({ children }) => <ul style={{ paddingLeft: '18px', marginBottom: '10px', color: '#c9d1d9' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: '18px', marginBottom: '10px', color: '#c9d1d9' }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: '4px', lineHeight: 1.75 }}>{children}</li>,
            code: ({ children }) => <code style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', background: '#1c2330', padding: '1px 6px', borderRadius: '3px', color: '#e6b84a' }}>{children}</code>,
            blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #e6b84a', paddingLeft: '12px', color: '#8b949e', margin: '10px 0', fontStyle: 'italic' }}>{children}</blockquote>,
          }}
        >
          {draft.content}
        </ReactMarkdown>
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, padding: '10px 12px',
              background: copied ? 'linear-gradient(135deg, #56d364, #3fb950)' : 'linear-gradient(135deg, #e6b84a, #c9953a)',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              color: '#0d1117', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copied ? '✅ 복사됨!' : '📋 텍스트 복사'}
          </button>
          <button
            onClick={handleCopyHtml}
            style={{
              flex: 1, padding: '10px 12px',
              background: copiedHtml ? 'linear-gradient(135deg, #56d364, #3fb950)' : 'linear-gradient(135deg, #58a6ff, #388bfd)',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              color: '#0d1117', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copiedHtml ? '✅ 복사됨!' : '🌐 HTML 복사'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            onClick={onRevise}
            style={ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; }}
          >
            🔄 수정
          </button>
          <button
            onClick={onReset}
            style={{ ...ghostBtn, borderColor: '#f8514944' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f85149'; e.currentTarget.style.color = '#f85149'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f8514944'; e.currentTarget.style.color = '#8b949e'; }}
          >
            🆕 새 주제
          </button>
        </div>
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  flex: 1, padding: '10px 10px',
  background: 'transparent',
  border: '1px solid #30363d', borderRadius: '8px',
  fontSize: '12px', color: '#8b949e', cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
};
