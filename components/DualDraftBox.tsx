'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { DraftResult, TopicEvaluation } from '@/lib/types';

export interface DualDraftBoxProps {
  drafts: DraftResult[];
  selectedTopics: TopicEvaluation[];
  streamingText?: string;
  onCopyAll: () => void;
  onCopyOne: (index: number) => void;
  onRewrite: (index: number) => void;
  onReset: () => void;
  onSaveToNotes: (index: number) => void;
}

// ── 마크다운 렌더 스타일 ──────────────────────────
type MdProps = { children?: React.ReactNode };

const mdComponents = {
  h1: ({ children }: MdProps) => (
    <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '18px', color: '#e6edf3', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>{children}</h1>
  ),
  h2: ({ children }: MdProps) => (
    <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '15px', color: '#e6b84a', fontWeight: 700, marginTop: '18px', marginBottom: '7px' }}>{children}</h2>
  ),
  h3: ({ children }: MdProps) => (
    <h3 style={{ fontSize: '13px', color: '#c9d1d9', fontWeight: 600, marginTop: '12px', marginBottom: '5px' }}>{children}</h3>
  ),
  p: ({ children }: MdProps) => (
    <p style={{ marginBottom: '9px', color: '#c9d1d9', lineHeight: 1.8 }}>{children}</p>
  ),
  strong: ({ children }: MdProps) => (
    <strong style={{ color: '#e6edf3', fontWeight: 700 }}>{children}</strong>
  ),
  ul: ({ children }: MdProps) => (
    <ul style={{ paddingLeft: '18px', marginBottom: '9px', color: '#c9d1d9' }}>{children}</ul>
  ),
  ol: ({ children }: MdProps) => (
    <ol style={{ paddingLeft: '18px', marginBottom: '9px', color: '#c9d1d9' }}>{children}</ol>
  ),
  li: ({ children }: MdProps) => (
    <li style={{ marginBottom: '4px', lineHeight: 1.75 }}>{children}</li>
  ),
  code: ({ children }: MdProps) => (
    <code style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', background: '#1c2330', padding: '1px 5px', borderRadius: '3px', color: '#e6b84a' }}>{children}</code>
  ),
  blockquote: ({ children }: MdProps) => (
    <blockquote style={{ borderLeft: '3px solid #e6b84a', paddingLeft: '12px', color: '#8b949e', margin: '10px 0', fontStyle: 'italic' }}>{children}</blockquote>
  ),
  table: ({ children }: MdProps) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>{children}</table>
  ),
  th: ({ children }: MdProps) => (
    <th style={{ padding: '6px 10px', background: '#21262d', border: '1px solid #30363d', color: '#8b949e', fontWeight: 600, textAlign: 'left' }}>{children}</th>
  ),
  td: ({ children }: MdProps) => (
    <td style={{ padding: '6px 10px', border: '1px solid #30363d', color: '#c9d1d9' }}>{children}</td>
  ),
};

// ── 공유 스타일 ──────────────────────────────────
const ghostBtn: React.CSSProperties = {
  padding: '8px 12px',
  background: 'transparent',
  border: '1px solid #30363d',
  borderRadius: '7px',
  fontSize: '12px',
  color: '#8b949e',
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
};

// ── 비교 테이블 ──────────────────────────────────
function CompareTable({ drafts, topics }: { drafts: DraftResult[]; topics: TopicEvaluation[] }) {
  const rows = [
    { label: 'SEO 점수', vals: topics.map((t) => `${t.seo_score}점`) },
    { label: '예상 검색량', vals: topics.map((t) => String(t.search_volume)) },
    { label: '종합점수', vals: topics.map((t) => String(t.combined_score)) },
    { label: '글자 수', vals: drafts.map((d) => `${(d.word_count ?? 0).toLocaleString()}자`) },
  ];

  const colStyle = (i: number): React.CSSProperties => ({
    width: '35%',
    padding: '7px 10px',
    border: '1px solid #30363d',
    color: i === 0 ? '#e6b84a' : '#8b949e',
    fontSize: '12px',
    fontWeight: 500,
    textAlign: 'center',
    background: i === 0 ? '#e6b84a08' : 'transparent',
  });

  return (
    <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ width: '30%', padding: '7px 10px', border: '1px solid #30363d', background: '#21262d', color: '#484f58', textAlign: 'left', fontWeight: 600 }}>
              항목
            </th>
            {topics.map((t, i) => (
              <th key={i} style={{ ...colStyle(i), fontFamily: "'Noto Serif KR', serif" }}>
                {i + 1}번 — {t.title.length > 14 ? t.title.slice(0, 14) + '…' : t.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td style={{ padding: '7px 10px', border: '1px solid #30363d', color: '#8b949e', fontWeight: 500 }}>
                {row.label}
              </td>
              {row.vals.map((v, i) => (
                <td key={i} style={{ ...colStyle(i), color: i === 0 ? '#e6b84a' : '#8b949e' }}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 초안 본문 패널 ───────────────────────────────
function DraftPanel({
  draft,
  topic,
  index,
  onCopyOne,
  onRewrite,
  onSaveToNotes,
}: {
  draft: DraftResult;
  topic?: TopicEvaluation;
  index: number;
  onCopyOne: (i: number) => void;
  onRewrite: (i: number) => void;
  onSaveToNotes: (i: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft.content);
    setCopied(true);
    onCopyOne(index);
    toast('📋 클립보드에 복사됐습니다! 티스토리에 붙여넣기 하세요.', {
      duration: 3000,
      style: { background: '#161b22', border: '1px solid #56d36455', color: '#56d364' },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNotes = async () => {
    if (notesLoading) return;
    setNotesLoading(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft,
          seoScore: topic?.seo_score ?? 0,
          searchVolume: topic?.search_volume ?? 0,
        }),
      });
      const data = await res.json();

      if (data.success && data.method === 'applescript') {
        toast(`✅ Apple Notes에 저장되었습니다! (${data.noteTitle})`, {
          duration: 4000,
          style: { background: '#161b22', border: '1px solid #56d36455', color: '#56d364' },
        });
        setNotesSaved(true);
      } else if (data.method === 'clipboard') {
        // 서버가 클립보드 폴백을 반환 → 클라이언트에서 클립보드 복사
        const text = `# ${draft.meta_title}\n\n${draft.meta_desc}\n\n---\n\n${draft.content}`;
        await navigator.clipboard.writeText(text);
        toast('📋 클립보드에 복사되었습니다. Notes 앱에 붙여넣기 해주세요.', {
          duration: 4000,
          style: { background: '#161b22', border: '1px solid #e6b84a55', color: '#e6b84a' },
        });
        setNotesSaved(true);
      } else {
        toast.error('❌ 저장에 실패했습니다. 수동으로 복사해주세요.');
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setNotesLoading(false);
      onSaveToNotes(index);
      setTimeout(() => setNotesSaved(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 메타 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '10px', color: '#484f58', fontWeight: 600, marginBottom: '3px', letterSpacing: '0.5px' }}>
            META TITLE
          </p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#e6edf3', lineHeight: 1.4, fontFamily: "'Noto Serif KR', serif" }}>
            {draft.meta_title}
          </p>
        </div>
        {topic && (
          <div
            style={{
              flexShrink: 0,
              padding: '4px 10px',
              borderRadius: '8px',
              background: topic.combined_score >= 80 ? '#e6b84a22' : '#8b949e22',
              border: `1px solid ${topic.combined_score >= 80 ? '#e6b84a55' : '#8b949e33'}`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '10px', color: '#484f58', marginBottom: '1px' }}>종합점수</p>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '18px',
              fontWeight: 700,
              color: topic.combined_score >= 80 ? '#e6b84a' : '#8b949e',
              lineHeight: 1,
            }}>
              {topic.combined_score}
            </p>
          </div>
        )}
      </div>

      {/* 메타 설명 */}
      <div style={{ padding: '9px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#484f58', marginBottom: '3px' }}>META DESC</p>
        <p style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.65 }}>{draft.meta_desc}</p>
      </div>

      {/* 태그 + 글자 수 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {draft.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '11px', padding: '2px 9px', borderRadius: '20px',
                background: '#e6b84a18', border: '1px solid #e6b84a44', color: '#e6b84a',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
        <span style={{ fontSize: '11px', color: '#484f58', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
          {(draft.word_count ?? 0).toLocaleString()}자
        </span>
      </div>

      {/* 본문 마크다운 */}
      <div
        style={{
          maxHeight: '360px',
          overflowY: 'auto',
          padding: '14px',
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: 1.85,
        }}
      >
        <ReactMarkdown components={mdComponents}>{draft.content}</ReactMarkdown>
      </div>

      {/* SEO 팁 */}
      {draft.seo_tips?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#484f58', letterSpacing: '0.5px' }}>🔍 SEO TIP</p>
          {draft.seo_tips.map((tip, i) => (
            <div key={i} style={{ padding: '7px 11px', background: '#1f6feb0d', border: '1px solid #1f6feb22', borderRadius: '5px', fontSize: '12px', color: '#8b949e', lineHeight: 1.6 }}>
              💡 {tip}
            </div>
          ))}
        </div>
      )}

      {/* 탭별 액션 버튼 */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button
          onClick={handleCopy}
          style={{
            ...ghostBtn,
            flex: '1 1 auto',
            background: copied ? '#56d36422' : 'transparent',
            borderColor: copied ? '#56d364' : '#30363d',
            color: copied ? '#56d364' : '#8b949e',
          }}
          onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3'; } }}
          onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; } }}
        >
          {copied ? '✓ 복사됨' : '📋 이 초안 복사'}
        </button>

        <button
          onClick={handleNotes}
          disabled={notesLoading}
          style={{
            ...ghostBtn,
            flex: '1 1 auto',
            background: notesSaved ? '#3fb95018' : 'transparent',
            borderColor: notesSaved ? '#3fb950' : '#30363d',
            color: notesSaved ? '#3fb950' : notesLoading ? '#484f58' : '#8b949e',
            cursor: notesLoading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!notesSaved && !notesLoading) { e.currentTarget.style.borderColor = '#e6b84a66'; e.currentTarget.style.color = '#e6b84a'; } }}
          onMouseLeave={(e) => { if (!notesSaved && !notesLoading) { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; } }}
        >
          {notesLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
              <span style={{ width: '10px', height: '10px', border: '1.5px solid #484f58', borderTopColor: '#e6b84a', borderRadius: '50%', animation: 'dual-spin 0.8s linear infinite', display: 'inline-block' }} />
              저장 중...
            </span>
          ) : notesSaved ? '✅ 저장됨!' : '🍎 Apple Notes 저장'}
        </button>

        <button
          onClick={() => onRewrite(index)}
          style={ghostBtn}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#58a6ff66'; e.currentTarget.style.color = '#58a6ff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; }}
        >
          🔄 이 초안 재작성
        </button>
      </div>
    </div>
  );
}

// ── 로딩 스켈레톤 (2번 초안 생성 중) ────────────
function Draft2Loading({ streamingText }: { streamingText?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span
          style={{
            width: '10px', height: '10px', borderRadius: '50%',
            border: '2px solid #30363d', borderTopColor: '#58a6ff',
            animation: 'dual-spin 0.8s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '13px', color: '#58a6ff', fontWeight: 600 }}>
          ✍️ 2번 초안 작성 중...
        </span>
      </div>

      {streamingText ? (
        <div
          style={{
            padding: '14px',
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#8b949e',
            lineHeight: 1.8,
            maxHeight: '320px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
          }}
        >
          {streamingText.slice(-600)}
          <span
            style={{
              display: 'inline-block', width: '2px', height: '13px',
              background: '#58a6ff', marginLeft: '2px', verticalAlign: 'middle',
              animation: 'dual-blink 0.8s step-end infinite',
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[100, 85, 92, 70, 88].map((w, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{ height: '14px', background: '#21262d', borderRadius: '4px', width: `${w}%` }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes dual-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dual-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────
export function DualDraftBox({
  drafts,
  selectedTopics,
  streamingText,
  onCopyAll,
  onCopyOne,
  onRewrite,
  onReset,
  onSaveToNotes,
}: DualDraftBoxProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [allCopied, setAllCopied] = useState(false);

  const bothDone = drafts.length >= 2;

  // 2번 초안 완성 시 탭 2로 자동 전환
  useEffect(() => {
    if (drafts.length === 2 && activeTab === 0) {
      const t = setTimeout(() => setActiveTab(1), 400);
      return () => clearTimeout(t);
    }
  }, [drafts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyAll = async () => {
    if (drafts.length < 2) return;
    const combined = `# ${drafts[0].meta_title}\n\n${drafts[0].content}\n\n---\n\n# ${drafts[1].meta_title}\n\n${drafts[1].content}`;
    await navigator.clipboard.writeText(combined);
    setAllCopied(true);
    onCopyAll();
    toast('📋 두 초안이 모두 복사됐습니다!', {
      duration: 3000,
      style: { background: '#161b22', border: '1px solid #56d36455', color: '#56d364' },
    });
    setTimeout(() => setAllCopied(false), 2000);
  };

  const tabLabel = (i: number) => {
    const draft = drafts[i];
    if (!draft) return `${i + 1}번 작성 중...`;
    const title = draft.meta_title ?? '';
    return `${i === 0 ? '①' : '②'} ${title.length > 18 ? title.slice(0, 18) + '…' : title}`;
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        background: '#0d1117',
      }}
    >
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* 완료 배너 */}
        {bothDone && (
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #56d36418, #3fb95011)',
              border: '1px solid #56d36433',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '18px' }}>✅</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#56d364', marginBottom: '2px' }}>
                2개 초안 자동 생성 완료!
              </p>
              <p style={{ fontSize: '12px', color: '#8b949e' }}>
                SEO 최적 주제를 선택하여 작성했습니다.
              </p>
            </div>
          </div>
        )}

        {/* 비교 요약 테이블 (둘 다 완성 + 토픽 데이터 있을 때) */}
        {bothDone && selectedTopics.length >= 2 && (
          <CompareTable drafts={drafts} topics={[selectedTopics[0], selectedTopics[1]]} />
        )}

        {/* 탭 헤더 */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '1px solid #30363d',
            paddingBottom: '0',
          }}
        >
          {[0, 1].map((i) => {
            const isActive = activeTab === i;
            const isDone = drafts.length > i;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: '8px 14px',
                  background: isActive ? '#1c2330' : 'transparent',
                  border: `1px solid ${isActive ? '#30363d' : 'transparent'}`,
                  borderBottom: isActive ? '1px solid #1c2330' : '1px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: '-1px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#e6edf3' : '#484f58',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  maxWidth: '240px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isDone ? (
                  <span style={{ color: '#56d364', fontSize: '10px' }}>●</span>
                ) : (
                  <span
                    style={{
                      width: '8px', height: '8px',
                      border: '1.5px solid #30363d',
                      borderTopColor: '#58a6ff',
                      borderRadius: '50%',
                      animation: 'dual-spin 0.8s linear infinite',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                )}
                {tabLabel(i)}
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <div
          style={{
            padding: '16px',
            background: '#1c2330',
            border: '1px solid #30363d',
            borderRadius: '0 8px 8px 8px',
          }}
        >
          {activeTab === 0 && drafts[0] ? (
            <DraftPanel
              draft={drafts[0]}
              topic={selectedTopics[0]}
              index={0}
              onCopyOne={onCopyOne}
              onRewrite={onRewrite}
              onSaveToNotes={onSaveToNotes}
            />
          ) : activeTab === 1 && drafts[1] ? (
            <DraftPanel
              draft={drafts[1]}
              topic={selectedTopics[1]}
              index={1}
              onCopyOne={onCopyOne}
              onRewrite={onRewrite}
              onSaveToNotes={onSaveToNotes}
            />
          ) : activeTab === 1 ? (
            <Draft2Loading streamingText={streamingText} />
          ) : null}
        </div>

        {/* 공통 하단 액션 */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyAll}
            disabled={!bothDone}
            style={{
              ...ghostBtn,
              flex: '2 1 auto',
              background: allCopied ? '#56d36422' : bothDone ? '#56d3640d' : 'transparent',
              borderColor: allCopied ? '#56d364' : bothDone ? '#56d36433' : '#30363d',
              color: allCopied ? '#56d364' : bothDone ? '#56d364' : '#484f58',
              cursor: bothDone ? 'pointer' : 'not-allowed',
              opacity: bothDone ? 1 : 0.5,
            }}
            onMouseEnter={(e) => { if (bothDone && !allCopied) { e.currentTarget.style.background = '#56d36422'; } }}
            onMouseLeave={(e) => { if (bothDone && !allCopied) { e.currentTarget.style.background = bothDone ? '#56d3640d' : 'transparent'; } }}
          >
            {allCopied ? '✓ 모두 복사됨' : '📋 두 초안 모두 복사'}
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                style={{ ...ghostBtn, borderColor: '#f8514933' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f85149'; e.currentTarget.style.color = '#f85149'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f8514933'; e.currentTarget.style.color = '#8b949e'; }}
              >
                🆕 새 주제
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>새 주제를 시작할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  현재 대화 내용과 생성된 초안이 모두 초기화됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={onReset}>초기화 및 시작</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
