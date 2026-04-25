'use client';

import type { DirectionResult } from '@/lib/types';

interface DirectionPanelProps {
  data: DirectionResult;
  onConfirm: () => void;
  onRevise:  () => void;
}

export function DirectionPanel({ data, onConfirm, onRevise }: DirectionPanelProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '14px',
        padding: '18px', background: '#1c2330',
        border: '1px solid #30363d', borderRadius: '12px',
      }}
    >
      {/* 섹션 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px', color: '#e6b84a',
            background: '#e6b84a18', border: '1px solid #e6b84a44',
            padding: '2px 8px', borderRadius: '20px',
          }}
        >
          DIRECTION
        </span>
        <span style={{ fontSize: '12px', color: '#8b949e' }}>방향성 분석 결과</span>
      </div>

      {/* 각도 / 독자 타깃 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <InfoRow icon="🎯" label="각도" value={data.angle} />
        <InfoRow icon="👥" label="독자 타깃" value={data.target} />
      </div>

      {/* 후크 문장 */}
      <div
        style={{
          borderLeft: '3px solid #e6b84a',
          paddingLeft: '14px',
          padding: '10px 14px',
          background: '#e6b84a0a',
          borderRadius: '0 8px 8px 0',
        }}
      >
        <p style={{ fontSize: '10px', color: '#484f58', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '5px' }}>
          후크 문장
        </p>
        <p style={{ fontSize: '13px', color: '#e6edf3', lineHeight: 1.75, fontStyle: 'italic' }}>
          "{data.hook}"
        </p>
      </div>

      {/* 아웃라인 */}
      {data.outline?.length > 0 && (
        <div>
          <p style={sectionTitle}>아웃라인</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.outline.map((section, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '7px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: section.points?.length ? '6px' : 0 }}>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '11px', color: '#e6b84a', flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e6edf3' }}>
                    {section.section ?? ''}
                  </span>
                </div>
                {section.points?.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {section.points.map((pt: string, j: number) => (
                      <li key={j} style={{ fontSize: '11px', color: '#8b949e', lineHeight: 1.6 }}>
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO 키워드 */}
      {data.seo_keywords?.length > 0 && (
        <div>
          <p style={sectionTitle}>SEO 키워드</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {data.seo_keywords.map((kw) => (
              <span
                key={kw}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  background: '#e6b84a18',
                  border: '1px solid #e6b84a55',
                  color: '#e6b84a',
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SEO 점수 */}
      {data.seo_score_estimate !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>SEO 점수</span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '14px', fontWeight: 700,
              color: data.seo_score_estimate >= 80 ? '#56d364' : data.seo_score_estimate >= 60 ? '#e6b84a' : '#f85149',
            }}
          >
            {data.seo_score_estimate} / 100
          </span>
        </div>
      )}

      {/* 확인 질문 */}
      {data.confirm_question && (
        <div
          style={{
            padding: '10px 14px',
            background: '#21262d', border: '1px solid #30363d',
            borderRadius: '8px', fontSize: '12px',
            color: '#8b949e', lineHeight: 1.65,
          }}
        >
          💬 {data.confirm_question}
        </div>
      )}

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 2,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #e6b84a, #c9953a)',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            color: '#0d1117', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          ✅ 이 방향으로 작성
        </button>
        <button
          onClick={onRevise}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid #30363d', borderRadius: '8px',
            fontSize: '13px', color: '#8b949e', cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b949e';
            e.currentTarget.style.color = '#e6edf3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#30363d';
            e.currentTarget.style.color = '#8b949e';
          }}
        >
          ✏️ 수정 요청
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <span style={{ fontSize: '13px', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '11px', color: '#484f58', fontWeight: 600, flexShrink: 0, minWidth: '52px' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', color: '#e6edf3', lineHeight: 1.6 }}>{value}</span>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
  color: '#484f58',
  marginBottom: '8px',
};
