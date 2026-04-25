'use client';

import { useState } from 'react';
import type { Topic, TopicResult } from '@/lib/types';

const DIFFICULTY_DOT: Record<string, string> = {
  '입문': '🟢',
  '중급': '🟡',
  '고급': '🔴',
};

interface TopicCardsProps {
  data: TopicResult;
  onSelect: (topic: Topic) => void;
}

export function TopicCards({ data, onSelect }: TopicCardsProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (topic: Topic, idx: number) => {
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
        const isSelected = selected === i;
        return (
          <div
            key={topic.num ?? i}
            onClick={() => handleSelect(topic, i)}
            style={{
              padding: '14px 16px',
              background: isSelected ? '#e6b84a0d' : '#1c2330',
              border: `1px solid ${isSelected ? '#e6b84a' : '#30363d'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.18s',
              boxShadow: isSelected ? '0 0 0 1px #e6b84a22' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = '#e6b84a66';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = '#30363d';
            }}
          >
            {/* 상단: 번호 + 제목 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#e6b84a',
                  flexShrink: 0,
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
                }}
              >
                {topic.title}
              </span>
            </div>

            {/* 각도/차별점 */}
            <p style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.65, marginBottom: '10px' }}>
              {topic.angle}
            </p>

            {/* 하단: 키워드 + 난이도 + 조회수 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              {/* 키워드 배지 */}
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

              {/* 난이도 + 조회수 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '13px' }}>
                  {DIFFICULTY_DOT[topic.difficulty] ?? '🟡'}
                </span>
                {topic.est_views !== undefined && (
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '10px',
                      color: '#484f58',
                    }}
                  >
                    {topic.est_views}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

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
