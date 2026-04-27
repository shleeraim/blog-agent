'use client';

export type StepStatus = 'idle' | 'running' | 'done' | 'failed';

export interface PipelineSteps {
  topic: StepStatus;
  evaluate: StepStatus;
  draft1: StepStatus;
  notes1: StepStatus;
  draft2: StepStatus;
  notes2: StepStatus;
}

interface PipelineStatusProps {
  steps: PipelineSteps;
  selectedTitles?: [string, string] | null;
  stepMessages?: Partial<Record<keyof PipelineSteps, string>>;
}

const STEP_DEFS: { key: keyof PipelineSteps; icon: string; label: string }[] = [
  { key: 'topic',    icon: '🔍', label: '주제 탐색' },
  { key: 'evaluate', icon: '📊', label: 'SEO 평가' },
  { key: 'draft1',   icon: '✍️', label: '1번 초안 작성' },
  { key: 'notes1',   icon: '🍎', label: '1번 초안 Apple Notes 저장' },
  { key: 'draft2',   icon: '✍️', label: '2번 초안 작성' },
  { key: 'notes2',   icon: '🍎', label: '2번 초안 Apple Notes 저장' },
];

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#3fb95033', border: '1px solid #3fb950',
        fontSize: '11px', color: '#3fb950', flexShrink: 0, transition: 'all 0.3s',
      }}>✓</span>
    );
  }
  if (status === 'failed') {
    return (
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#d2992222', border: '1px solid #d29922',
        fontSize: '11px', color: '#d29922', flexShrink: 0,
      }}>⚠</span>
    );
  }
  if (status === 'running') {
    return (
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#1f6feb22', border: '1px solid #58a6ff', flexShrink: 0,
      }}>
        <span style={{
          width: '10px', height: '10px',
          border: '2px solid #30363d', borderTopColor: '#58a6ff',
          borderRadius: '50%', animation: 'pipeline-spin 0.8s linear infinite',
          display: 'inline-block',
        }} />
      </span>
    );
  }
  return (
    <span style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '20px', height: '20px', borderRadius: '50%',
      background: '#21262d', border: '1px solid #30363d',
      fontSize: '11px', color: '#484f58', flexShrink: 0,
    }}>⏳</span>
  );
}

export function PipelineStatus({ steps, selectedTitles, stepMessages }: PipelineStatusProps) {
  const anyActive = Object.values(steps).some((s) => s !== 'idle');
  if (!anyActive) return null;

  return (
    <div style={{
      flexShrink: 0, margin: '0 16px 8px', padding: '12px 16px',
      background: '#161b22', border: '1px solid #30363d', borderRadius: '10px',
    }}>
      <div style={{ fontSize: '11px', color: '#484f58', fontWeight: 600, marginBottom: '10px', letterSpacing: '0.5px' }}>
        🚀 자동 완성 파이프라인
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {STEP_DEFS.map((def) => {
          const status = steps[def.key];
          const isActive = status === 'running';
          const isDone = status === 'done';
          const isFailed = status === 'failed';

          // notes 스텝은 idle이면 숨김
          if ((def.key === 'notes1' || def.key === 'notes2') && status === 'idle') return null;

          // 커스텀 메시지 우선, 없으면 기본 라벨
          let label = stepMessages?.[def.key] ?? def.label;
          if (!stepMessages?.[def.key] && def.key === 'evaluate' && isDone && selectedTitles) {
            label = `${def.label} 완료 — ${selectedTitles[0]} · ${selectedTitles[1]}`;
          }

          return (
            <div key={def.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StatusIcon status={status} />
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px' }}>{def.icon}</span>
                <span style={{
                  fontSize: '12px',
                  color: isDone ? '#3fb950' : isFailed ? '#d29922' : isActive ? '#e6edf3' : '#484f58',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'color 0.3s',
                }}>
                  {label}
                </span>
                {isActive && <span style={{ fontSize: '11px', color: '#58a6ff' }}>진행 중...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pipeline-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
