'use client';

import { useState } from 'react';
import { useAgentStore } from '@/lib/store';

export function RightPanel() {
  const { draft, currentStep } = useAgentStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 초안이 없을 때
  if (!draft || currentStep < 4) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '12px',
          color: '#484f58', textAlign: 'center', padding: '20px',
        }}
      >
        <div
          style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#21262d', border: '1px solid #30363d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}
        >
          📄
        </div>
        <div>
          <p style={{ fontSize: '13px', color: '#8b949e', fontWeight: 600, marginBottom: '4px' }}>
            초안 미리보기
          </p>
          <p style={{ fontSize: '11px', lineHeight: 1.6 }}>
            초안이 완성되면<br />여기서 확인할 수 있어요
          </p>
        </div>

        {/* 진행 안내 */}
        {currentStep === 1 && <StepGuide step={1} />}
        {currentStep === 2 && <StepGuide step={2} />}
        {currentStep === 3 && <StepGuide step={3} />}
      </div>
    );
  }

  // 초안 완성
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '20px' }}>
      {/* Header */}
      <div>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '20px',
            background: '#3fb95022', border: '1px solid #3fb95033',
            fontSize: '11px', color: '#3fb950', fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3fb950', display: 'inline-block' }} />
          초안 완성
        </div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e6edf3', lineHeight: 1.4 }}>
          {draft.meta_title}
        </h2>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <StatChip icon="📝" label={`${draft.word_count.toLocaleString()}자`} />
        <StatChip icon="🏷️" label={`태그 ${draft.tags.length}개`} />
      </div>

      {/* Meta desc */}
      <div
        style={{
          padding: '10px 12px',
          background: '#21262d', border: '1px solid #30363d',
          borderRadius: '6px', fontSize: '12px',
          color: '#8b949e', lineHeight: 1.7,
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#484f58', display: 'block', marginBottom: '4px' }}>
          META DESCRIPTION
        </span>
        {draft.meta_desc}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {draft.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: '#21262d', border: '1px solid #30363d', color: '#58a6ff',
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Content preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          본문 미리보기
        </p>
        <div
          style={{
            maxHeight: '260px', overflowY: 'auto',
            padding: '12px',
            background: '#0d1117', border: '1px solid #30363d',
            borderRadius: '8px', fontSize: '11px',
            color: '#c9d1d9', lineHeight: 1.8,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {draft.content}
        </div>
      </div>

      {/* SEO tips */}
      {draft.seo_tips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            SEO 팁
          </p>
          {draft.seo_tips.map((tip, i) => (
            <div
              key={i}
              style={{
                padding: '7px 10px',
                background: '#1f6feb11', border: '1px solid #1f6feb22',
                borderRadius: '5px', fontSize: '11px',
                color: '#8b949e', lineHeight: 1.6,
              }}
            >
              💡 {tip}
            </div>
          ))}
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          padding: '9px',
          background: copied ? '#3fb95022' : 'linear-gradient(135deg, #1f6feb, #388bfd)',
          border: copied ? '1px solid #3fb950' : 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '12px', fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {copied ? '✓ 복사 완료!' : '📋 마크다운 전체 복사'}
      </button>
    </div>
  );
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        flex: 1, padding: '5px 8px',
        background: '#21262d', border: '1px solid #30363d',
        borderRadius: '6px', textAlign: 'center',
        fontSize: '11px', color: '#8b949e',
      }}
    >
      {icon} {label}
    </div>
  );
}

function StepGuide({ step }: { step: number }) {
  const guides: Record<number, { icon: string; text: string }> = {
    1: { icon: '💬', text: '주제를 입력하면 AI가 5가지 추천 주제를 제안해드려요' },
    2: { icon: '🎯', text: '주제를 선택하면 방향성을 자동으로 분석해드려요' },
    3: { icon: '✍️', text: '방향성을 확정하면 초안을 작성해드려요' },
  };
  const g = guides[step];
  if (!g) return null;
  return (
    <div
      style={{
        padding: '10px 12px', background: '#21262d',
        border: '1px solid #30363d', borderRadius: '8px',
        fontSize: '11px', color: '#8b949e',
        lineHeight: 1.6, textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{g.icon}</div>
      {g.text}
    </div>
  );
}
