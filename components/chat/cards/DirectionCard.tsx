'use client';

import { useState } from 'react';
import { useChatContext } from '@/context/ChatContext';
import type { DirectionResult } from '@/lib/types';

export function DirectionCard({ data }: { data: DirectionResult }) {
  const { sendMessage, isLoading } = useChatContext();
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (isLoading || confirmed) return;
    setConfirmed(true);
    await sendMessage('방향성을 확정했습니다. 이 방향으로 초안을 작성해주세요.', 'draft');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Label>📝 요약</Label>
        <p style={{ fontSize: '13px', color: '#e6edf3', lineHeight: 1.7 }}>{data.summary}</p>
      </div>

      {/* Row: angle + target */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <InfoBox label="🎯 관점" value={data.angle} />
        <InfoBox label="👤 타깃 독자" value={data.target} />
      </div>

      {/* Hook */}
      <div
        style={{
          padding: '10px 14px',
          background: '#bc8cff11',
          border: '1px solid #bc8cff33',
          borderLeft: '3px solid #bc8cff',
          borderRadius: '0 6px 6px 0',
          fontSize: '13px',
          color: '#e6edf3',
          fontStyle: 'italic',
          lineHeight: 1.7,
        }}
      >
        ✨ {data.hook}
      </div>

      {/* Outline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Label>📋 목차</Label>
        {data.outline.map((item, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: '6px',
            }}
          >
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#58a6ff', marginBottom: '6px' }}>
              {i + 1}. {item.section}
            </p>
            <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {item.points.map((pt, j) => (
                <li key={j} style={{ fontSize: '11px', color: '#8b949e', lineHeight: 1.5 }}>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* SEO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>🔍 SEO 키워드</Label>
          {data.seo_score_estimate > 0 && (
            <span style={{ fontSize: '11px', color: seoColor(data.seo_score_estimate) }}>
              SEO 예상 점수: {data.seo_score_estimate}/100
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {data.seo_keywords.map((kw) => (
            <span
              key={kw}
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '20px',
                background: '#21262d',
                border: '1px solid #30363d',
                color: '#8b949e',
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Confirm question + button */}
      <div
        style={{
          padding: '12px 14px',
          background: '#3fb95011',
          border: '1px solid #3fb95033',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <p style={{ fontSize: '13px', color: '#8b949e', flex: 1 }}>{data.confirm_question}</p>
        <button
          onClick={handleConfirm}
          disabled={isLoading || confirmed}
          style={{
            padding: '8px 18px',
            background: confirmed ? '#3fb95033' : 'linear-gradient(135deg, #3fb950, #2ea043)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isLoading || confirmed ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {confirmed ? '✓ 초안 작성 중...' : '✅ 초안 작성하기'}
        </button>
      </div>
    </div>
  );
}

// ── 내부 헬퍼 컴포넌트 ──
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {children}
    </p>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px' }}>
      <p style={{ fontSize: '10px', color: '#484f58', marginBottom: '4px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '12px', color: '#e6edf3', lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

function seoColor(score: number): string {
  if (score >= 75) return '#3fb950';
  if (score >= 50) return '#d29922';
  return '#f85149';
}
