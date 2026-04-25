'use client';

const STEPS = [
  { label: '주제 탐색', icon: '🔍' },
  { label: '방향 확정', icon: '🎯' },
  { label: '글 작성',   icon: '✍️' },
  { label: '완료',      icon: '🎉' },
];

export function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid #30363d',
        background: '#161b22',
        flexShrink: 0,
      }}
    >
      {STEPS.map((step, i) => {
        const num = i + 1;
        const isDone    = currentStep > num;
        const isCurrent = currentStep === num;

        return (
          <div
            key={num}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '12px 8px',
              borderBottom: isDone
                ? '2px solid #56d364'
                : isCurrent
                ? '2px solid #e6b84a'
                : '2px solid transparent',
              transition: 'border-color 0.3s',
            }}
          >
            {/* 완료 체크 아이콘 */}
            {isDone ? (
              <span style={{ fontSize: '13px', lineHeight: 1 }}>✓</span>
            ) : (
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 500,
                  background: isCurrent ? '#e6b84a22' : '#21262d',
                  border: `1px solid ${isCurrent ? '#e6b84a' : '#30363d'}`,
                  color: isCurrent ? '#e6b84a' : '#484f58',
                  flexShrink: 0,
                }}
              >
                {num}
              </span>
            )}
            <span
              style={{
                fontSize: '12px',
                fontWeight: isCurrent ? 600 : 400,
                color: isDone
                  ? '#56d364'
                  : isCurrent
                  ? '#e6b84a'
                  : '#484f58',
                letterSpacing: '-0.2px',
                transition: 'color 0.3s',
                whiteSpace: 'nowrap',
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
