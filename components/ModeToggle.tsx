'use client';

import { useAgentStore } from '@/lib/store';

export function ModeToggle() {
  const { autoMode, setAutoMode, isPipelineRunning, reset, clearDrafts } = useAgentStore();

  const handleToggle = () => {
    if (isPipelineRunning) return;
    const next = !autoMode;
    setAutoMode(next);
    // 모드 전환 시 현재 세션 초기화
    clearDrafts();
    reset();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPipelineRunning}
      title={autoMode ? '수동 모드로 전환' : '자동 완성 모드로 전환'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '5px 12px',
        background: autoMode ? '#e6b84a14' : '#30363d44',
        border: `1px solid ${autoMode ? '#e6b84a55' : '#30363d'}`,
        borderRadius: '20px',
        cursor: isPipelineRunning ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: isPipelineRunning ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isPipelineRunning) {
          e.currentTarget.style.background = autoMode ? '#e6b84a22' : '#30363d88';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = autoMode ? '#e6b84a14' : '#30363d44';
      }}
    >
      {/* 트랙 */}
      <span
        style={{
          position: 'relative',
          width: '28px',
          height: '16px',
          borderRadius: '8px',
          background: autoMode ? '#e6b84a' : '#484f58',
          transition: 'background 0.2s',
          flexShrink: 0,
          display: 'inline-block',
        }}
      >
        {/* 노브 */}
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: autoMode ? '14px' : '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </span>

      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: autoMode ? '#e6b84a' : '#8b949e',
          transition: 'color 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        {autoMode ? '🚀 자동' : '🔧 수동'}
      </span>
    </button>
  );
}
