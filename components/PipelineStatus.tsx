'use client';

export interface PipelineStep {
  id: string;
  label: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  detail?: string;
}

interface PipelineStatusProps {
  steps: PipelineStep[];
}

function StatusIcon({ status }: { status: PipelineStep['status'] }) {
  if (status === 'done') {
    return (
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#3fb95033', border: '1px solid #3fb950',
        fontSize: '11px', color: '#3fb950', flexShrink: 0,
      }}>✓</span>
    );
  }
  if (status === 'error') {
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

export function PipelineStatus({ steps }: PipelineStatusProps) {
  const anyActive = steps.some((s) => s.status !== 'waiting');
  if (!anyActive) return null;

  return (
    <div style={{
      flexShrink: 0, margin: '0 16px 8px', padding: '12px 16px',
      background: '#161b22', border: '1px solid #30363d', borderRadius: '10px',
    }}>
      <div style={{
        fontSize: '11px', color: '#484f58', fontWeight: 600,
        marginBottom: '10px', letterSpacing: '0.5px',
      }}>
        🚀 자동 완성 파이프라인
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          const isDone = step.status === 'done';
          const isError = step.status === 'error';

          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StatusIcon status={step.status} />
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '12px',
                  color: isDone ? '#3fb950' : isError ? '#d29922' : isRunning ? '#e6edf3' : '#484f58',
                  fontWeight: isRunning ? 600 : 400,
                  transition: 'color 0.3s',
                }}>
                  {step.label}
                </span>
                {isRunning && (
                  <span style={{ fontSize: '11px', color: '#58a6ff' }}>진행 중...</span>
                )}
                {step.detail && (
                  <span style={{
                    fontSize: '11px',
                    color: isDone ? '#3fb95088' : '#d2992288',
                  }}>
                    — {step.detail}
                  </span>
                )}
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
