'use client';

import { useAgentStore } from '@/lib/store';
import { useChatContext } from '@/context/ChatContext';
import type { TopicResult, Topic } from '@/lib/types';

const DIFFICULTY_STYLE: Record<Topic['difficulty'], { bg: string; color: string }> = {
  '입문': { bg: '#3fb95022', color: '#3fb950' },
  '중급': { bg: '#d2992222', color: '#d29922' },
  '고급': { bg: '#f8514922', color: '#f85149' },
};

export function TopicsCard({ data }: { data: TopicResult }) {
  const { setSelectedTopic, setStep, selectedTopic } = useAgentStore();
  const { sendMessage, isLoading } = useChatContext();

  const handleSelect = async (topic: Topic) => {
    if (isLoading) return;
    setSelectedTopic(topic);
    setStep(2);
    await sendMessage(
      `주제 ${topic.num}번 "${topic.title}"을 선택했습니다. 이 주제로 방향성을 분석해주세요.`,
      'direction'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Intro */}
      <p style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.7, marginBottom: '4px' }}>
        {data.intro}
      </p>

      {/* Topic list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.topics.map((topic) => {
          const diffStyle = DIFFICULTY_STYLE[topic.difficulty];
          const isSelected = selectedTopic?.num === topic.num;

          return (
            <button
              key={topic.num}
              onClick={() => handleSelect(topic)}
              disabled={isLoading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '12px 14px',
                background: isSelected ? '#1f6feb22' : '#21262d',
                border: `1px solid ${isSelected ? '#1f6feb' : '#30363d'}`,
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                opacity: isLoading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isLoading)
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#58a6ff66';
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d';
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#58a6ff',
                    background: '#1f6feb22',
                    padding: '1px 7px',
                    borderRadius: '4px',
                  }}
                >
                  #{topic.num}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e6edf3', flex: 1 }}>
                  {topic.title}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: diffStyle.bg,
                    color: diffStyle.color,
                    border: `1px solid ${diffStyle.color}44`,
                  }}
                >
                  {topic.difficulty}
                </span>
              </div>

              {/* Angle */}
              <p style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>{topic.angle}</p>

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
            </button>
          );
        })}
      </div>

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
