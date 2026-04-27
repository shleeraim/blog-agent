'use client';

import { useAgentStore } from '@/lib/store';
import { useChatContext } from '@/context/ChatContext';
import type { TopicResult, Topic } from '@/lib/types';

const DIFFICULTY_STYLE: Record<Topic['difficulty'], { bg: string; color: string }> = {
  '입문': { bg: '#3fb95022', color: '#3fb950' },
  '중급': { bg: '#d2992222', color: '#d29922' },
  '고급': { bg: '#f8514922', color: '#f85149' },
};

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
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
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
      <div style={{ flex: 1, background: '#21262d', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: '3px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '10px',
          color,
          width: '22px',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

export function TopicsCard({ data }: { data: TopicResult }) {
  const {
    setSelectedTopic,
    setStep,
    selectedTopic,
    evaluations,
    isEvaluating,
    isPipelineRunning,
    selectionReason,
  } = useAgentStore();
  const { sendMessage, isLoading } = useChatContext();

  const hasEval = evaluations.length > 0;
  const evalMap = new Map(evaluations.map((e) => [e.title, e]));
  const blocked = isLoading || isPipelineRunning;

  const handleSelect = async (topic: Topic) => {
    if (blocked || hasEval) return; // 평가 결과 있으면 자동 모드 — 수동 선택 비활성
    setSelectedTopic(topic);
    setStep(2);
    await sendMessage(
      `주제 ${topic.num}번 "${topic.title}"을 선택했습니다. 이 주제로 방향성을 분석해주세요.`,
      'direction'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Intro */}
      <p style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.7, marginBottom: '2px' }}>
        {data.intro}
      </p>

      {/* Topic list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.topics.map((topic) => {
          const diffStyle = DIFFICULTY_STYLE[topic.difficulty];
          const isUserSelected = selectedTopic?.num === topic.num;
          const ev = evalMap.get(topic.title);
          const isAutoSelected = ev?.selected ?? false;
          const dimmed = hasEval && !isAutoSelected;

          const borderColor = isAutoSelected ? '#e6b84a' : isUserSelected ? '#1f6feb' : '#30363d';
          const borderWidth = isAutoSelected ? '2px' : '1px';
          const bgColor = isAutoSelected ? '#e6b84a0d' : isUserSelected ? '#1f6feb22' : '#21262d';

          return (
            <div
              key={topic.num}
              onClick={() => handleSelect(topic)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '12px 14px',
                background: bgColor,
                border: `${borderWidth} solid ${borderColor}`,
                borderRadius: '8px',
                cursor: blocked || hasEval ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                opacity: dimmed ? 0.45 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isUserSelected && !isAutoSelected && !blocked && !hasEval)
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#58a6ff66';
              }}
              onMouseLeave={(e) => {
                if (!isUserSelected && !isAutoSelected)
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#30363d';
              }}
            >
              {/* Header row: 번호 + 제목 + 우측 배지 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#58a6ff',
                    background: '#1f6feb22',
                    padding: '1px 7px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  #{topic.num}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e6edf3', flex: 1, lineHeight: 1.4 }}>
                  {topic.title}
                </span>

                {/* 우측: 종합점수 + 자동선택 배지 */}
                {ev && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '18px',
                        fontWeight: 700,
                        lineHeight: 1,
                        padding: '2px 7px',
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
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '20px',
                          background: '#e6b84a22',
                          border: '1px solid #e6b84a55',
                          color: '#e6b84a',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ✅ 자동 선택
                      </span>
                    )}
                  </div>
                )}

                {/* 평가 없을 때 난이도 배지 */}
                {!ev && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      background: diffStyle.bg,
                      color: diffStyle.color,
                      border: `1px solid ${diffStyle.color}44`,
                      flexShrink: 0,
                    }}
                  >
                    {topic.difficulty}
                  </span>
                )}
              </div>

              {/* Angle */}
              <p style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>{topic.angle}</p>

              {/* 평가 점수 바 */}
              {ev && (
                <div style={{ marginTop: '2px', marginBottom: '2px' }}>
                  <ScoreBar label="SEO" score={ev.seo_score} color={seoBarColor(ev.seo_score)} />
                  <ScoreBar label="검색량" score={ev.search_volume} color="#388bfd" />
                </div>
              )}

              {/* Keywords & views */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {topic.keywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#30363d',
                      color: '#8b949e',
                    }}
                  >
                    {kw}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#58a6ff' }}>
                  📈 {topic.est_views}
                </span>
              </div>

              {/* 평가 중 skeleton */}
              {isEvaluating && (
                <div
                  className="animate-pulse"
                  style={{ marginTop: '4px', height: '6px', background: '#30363d', borderRadius: '3px' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* AI 선택 이유 */}
      {selectionReason && hasEval && (
        <div
          style={{
            padding: '10px 14px',
            background: '#e6b84a0a',
            border: '1px solid #e6b84a2a',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#c9a227',
            lineHeight: 1.75,
          }}
        >
          🤖 AI 선택 이유: {selectionReason}
        </div>
      )}

      {/* Tip */}
      <div
        style={{
          padding: '10px 12px',
          background: '#1f6feb11',
          border: '1px solid #1f6feb33',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#8b949e',
          lineHeight: 1.6,
        }}
      >
        💡 {data.tip}
      </div>
    </div>
  );
}
