'use client';

import { useState, useEffect, useRef } from 'react';
import type { Topic, TopicResult, TopicEvaluation } from '@/lib/types';
import { useAgentStore } from '@/lib/store';

const DIFFICULTY_DOT: Record<string, string> = {
  '입문': '🟢',
  '중급': '🟡',
  '고급': '🔴',
};

interface TopicCardsProps {
  data: TopicResult;
  evaluations: TopicEvaluation[];
  isEvaluating: boolean;
  onSelect: (topic: Topic) => void;
}

function seoBarColor(score: number): string {
  if (score <= 40) return '#f85149';
  if (score <= 70) return '#d29922';
  return '#3fb950';
}

function combinedScoreBg(score: number): string {
  if (score >= 80) return '#e6b84a22';
  if (score >= 60) return '#8b949e22';
  return 'transparent';
}

function combinedScoreColor(score: number): string {
  if (score >= 80) return '#e6b84a';
  if (score >= 60) return '#8b949e';
  return '#484f58';
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      <span
        style={{
          fontSize: '10px',
          color: '#8b949e',
          width: '32px',
          flexShrink: 0,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          background: '#21262d',
          borderRadius: '4px',
          height: '5px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '10px',
          color,
          width: '24px',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

export function TopicCards({ data, evaluations, isEvaluating, onSelect }: TopicCardsProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectionReason = useAgentStore((s) => s.selectionReason);
  const isPipelineRunning = useAgentStore((s) => s.isPipelineRunning);

  const hasEvaluations = evaluations.length > 0;
  const evalMap = new Map(evaluations.map((e) => [e.title, e]));

  // selectionReason이 새로 세팅되면 카운트다운 시작
  useEffect(() => {
    if (!selectionReason || !hasEvaluations) {
      setCountdown(null);
      return;
    }

    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // selectionReason이 바뀔 때마다 재실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionReason]);

  const handleSelect = (topic: Topic, idx: number) => {
    if (isEvaluating || isPipelineRunning) return;
    setSelected(idx);
    onSelect(topic);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* intro */}
      {data.intro && (
        <p style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.7, marginBottom: '2px' }}>
          {data.intro}
        </p>
      )}

      {/* 카드 목록 */}
      {data.topics.map((topic, i) => {
        const isUserSelected = selected === i;
        const ev = evalMap.get(topic.title);
        const isAutoSelected = ev?.selected ?? false;
        const dimmed = hasEvaluations && !isAutoSelected;

        const borderColor = isUserSelected || isAutoSelected ? '#e6b84a' : '#30363d';
        const borderWidth = isAutoSelected ? '2px' : '1px';
        const bgColor = isUserSelected || isAutoSelected ? '#e6b84a0d' : '#1c2330';
        const boxShadow = isAutoSelected ? '0 0 0 2px #e6b84a22' : 'none';

        return (
          <div
            key={topic.num ?? i}
            onClick={() => handleSelect(topic, i)}
            style={{
              padding: '14px 16px',
              background: bgColor,
              border: `${borderWidth} solid ${borderColor}`,
              borderRadius: '10px',
              cursor: isEvaluating || isPipelineRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s',
              boxShadow,
              opacity: dimmed ? 0.55 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isUserSelected && !isAutoSelected && !isEvaluating && !isPipelineRunning)
                e.currentTarget.style.borderColor = '#e6b84a66';
            }}
            onMouseLeave={(e) => {
              if (!isUserSelected && !isAutoSelected)
                e.currentTarget.style.borderColor = '#30363d';
            }}
          >
            {/* 상단: 번호 + 제목 + 우측 배지 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#e6b84a',
                  flexShrink: 0,
                  paddingTop: '2px',
                }}
              >
                {String(topic.num ?? i + 1).padStart(2, '0')}
              </span>

              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#e6edf3',
                  lineHeight: 1.4,
                  fontFamily: "'Noto Serif KR', serif",
                  flex: 1,
                }}
              >
                {topic.title}
              </span>

              {/* 우측: 종합점수 + 자동선택 배지 */}
              {ev && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '20px',
                      fontWeight: 700,
                      lineHeight: 1,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: combinedScoreBg(ev.combined_score),
                      color: combinedScoreColor(ev.combined_score),
                    }}
                  >
                    {ev.combined_score}
                  </span>
                  {isAutoSelected && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        background: '#e6b84a22',
                        border: '1px solid #e6b84a66',
                        color: '#e6b84a',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🏆 자동 선택
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 각도/차별점 */}
            <p style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.65, marginBottom: '10px' }}>
              {topic.angle}
            </p>

            {/* 평가 점수 바 */}
            {ev && (
              <div style={{ marginBottom: '10px' }}>
                <ScoreBar label="SEO" score={ev.seo_score} color={seoBarColor(ev.seo_score)} />
                <ScoreBar label="검색량" score={ev.search_volume} color="#388bfd" />
              </div>
            )}

            {/* 하단: 키워드 + 난이도 + 조회수 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {topic.keywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '10px',
                      padding: '2px 8px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '13px' }}>{DIFFICULTY_DOT[topic.difficulty] ?? '🟡'}</span>
                {topic.est_views !== undefined && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#484f58' }}>
                    {topic.est_views}
                  </span>
                )}
              </div>
            </div>

            {/* 평가 중 skeleton */}
            {isEvaluating && (
              <div
                className="animate-pulse"
                style={{ marginTop: '12px', height: '8px', background: '#30363d', borderRadius: '4px' }}
              />
            )}
          </div>
        );
      })}

      {/* AI 선택 이유 + 카운트다운 */}
      {selectionReason && hasEvaluations && (
        <div
          style={{
            padding: '12px 16px',
            background: '#e6b84a0d',
            border: '1px solid #e6b84a33',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#c9a227',
            lineHeight: 1.75,
          }}
        >
          🤖 AI 선택 이유: {selectionReason}

          {countdown !== null && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#8b949e' }}>
                3초 후 자동으로 초안 작성을 시작합니다...
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#e6b84a',
                  lineHeight: 1,
                  minWidth: '16px',
                  textAlign: 'center',
                }}
              >
                {countdown}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 팁 문구 */}
      {data.tip && (
        <div
          style={{
            padding: '10px 14px',
            background: '#e6b84a0d',
            border: '1px solid #e6b84a33',
            borderRadius: '8px',
            borderLeft: '3px solid #e6b84a',
            fontSize: '12px',
            color: '#e6b84a',
            lineHeight: 1.65,
          }}
        >
          💡 {data.tip}
        </div>
      )}
    </div>
  );
}
