'use client';

import { useEffect, useRef, useState } from 'react';
import type { DirectionResult, DraftResult } from '@/lib/types';

interface RightPanelProps {
  direction: DirectionResult | null;
  draft:     DraftResult | null;
}

export function RightPanel({ direction, draft }: RightPanelProps) {
  // 빈 상태
  if (!direction && !draft) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%', gap: '14px',
          padding: '24px', textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: '#1c2330', border: '1px solid #30363d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}
        >
          📋
        </div>
        <p style={{ fontSize: '13px', color: '#8b949e', fontWeight: 600 }}>초안 미리보기</p>
        <p style={{ fontSize: '11px', color: '#484f58', lineHeight: 1.7 }}>
          주제를 탐색하고<br />방향성이 확정되면<br />여기에 내용이 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
      {draft ? (
        /* ── 초안 완성 상태 ── */
        <DraftMeta draft={draft} />
      ) : direction ? (
        /* ── 방향성만 있는 상태 ── */
        <DirectionOutline direction={direction} />
      ) : null}
    </div>
  );
}

// ── 방향성 아웃라인 ──
function DirectionOutline({ direction }: { direction: DirectionResult }) {
  return (
    <>
      <PanelSection label="아웃라인">
        {direction.outline?.map((sec, i) => (
          <div
            key={i}
            style={{
              padding: '8px 10px',
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: '6px', marginBottom: '5px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: sec.points?.length ? '4px' : 0 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px', color: '#e6b84a',
                  background: '#e6b84a18', border: '1px solid #e6b84a44',
                  padding: '1px 6px', borderRadius: '4px',
                }}
              >
                H2
              </span>
              <span style={{ fontSize: '12px', color: '#e6edf3', fontWeight: 600 }}>
                {sec.section ?? ''}
              </span>
            </div>
            {sec.points?.map((pt: string, j: number) => (
              <div key={j} style={{ display: 'flex', alignItems: 'baseline', gap: '6px', paddingLeft: '4px', marginTop: '2px' }}>
                <span style={{ fontSize: '8px', color: '#484f58', flexShrink: 0, marginTop: '2px' }}>▸</span>
                <span style={{ fontSize: '11px', color: '#8b949e', lineHeight: 1.6 }}>{pt}</span>
              </div>
            ))}
          </div>
        ))}
      </PanelSection>

      {direction.seo_keywords?.length > 0 && (
        <PanelSection label="SEO 키워드">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {direction.seo_keywords.map((kw) => (
              <span key={kw} style={goldBadge}>{kw}</span>
            ))}
          </div>
        </PanelSection>
      )}

      {direction.seo_score_estimate !== undefined && (
        <PanelSection label="SEO 점수">
          <SeoBar score={direction.seo_score_estimate} />
        </PanelSection>
      )}
    </>
  );
}

// ── 초안 메타 ──
function DraftMeta({ draft }: { draft: DraftResult }) {
  return (
    <>
      <PanelSection label="메타 제목">
        <p style={{ fontSize: '13px', color: '#e6edf3', fontWeight: 600, fontFamily: "'Noto Serif KR', serif", lineHeight: 1.5 }}>
          {draft.meta_title}
        </p>
      </PanelSection>

      <PanelSection label="메타 설명">
        <p style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.7 }}>
          {draft.meta_desc}
        </p>
      </PanelSection>

      <PanelSection label="태그">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {draft.tags?.slice(0, 5).map((tag) => (
            <span key={tag} style={goldBadge}>#{tag}</span>
          ))}
        </div>
      </PanelSection>

      {draft.seo_tips?.length > 0 && (
        <PanelSection label="SEO 팁">
          {draft.seo_tips.slice(0, 2).map((tip, i) => (
            <div
              key={i}
              style={{
                padding: '8px 10px',
                background: '#2d7dd215', border: '1px solid #2d7dd230',
                borderRadius: '6px', fontSize: '11px',
                color: '#8b949e', lineHeight: 1.65, marginBottom: '5px',
              }}
            >
              💡 {tip}
            </div>
          ))}
        </PanelSection>
      )}
    </>
  );
}

// ── SEO 점수 바 ──
function SeoBar({ score }: { score: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const t = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const color = score >= 80 ? '#56d364' : score >= 60 ? '#e6b84a' : '#f85149';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: '#8b949e' }}>점수</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: '6px', background: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%', borderRadius: '3px',
            background: color,
            width: `${width}%`,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}

// ── 헬퍼 ──
function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.8px',
          color: '#484f58', marginBottom: '8px',
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

const goldBadge: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: '10px', padding: '2px 8px',
  borderRadius: '20px',
  background: '#e6b84a18', border: '1px solid #e6b84a55',
  color: '#e6b84a',
};
