'use client';

import { useState } from 'react';
import { useChatContext } from '@/context/ChatContext';
import type { ErrorData } from '@/lib/types';

export function ErrorCard({ data }: { data: ErrorData }) {
  const { sendMessage, isLoading } = useChatContext();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (isLoading || retrying) return;
    setRetrying(true);
    await sendMessage(data.retryMessage, data.retryStep);
    setRetrying(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 14px',
        background: '#f8514911',
        border: '1px solid #f8514944',
        borderLeft: '3px solid #f85149',
        borderRadius: '0 8px 8px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: '13px', color: '#f85149', lineHeight: 1.65 }}>
          {data.errorMessage}
        </p>
      </div>
      <button
        onClick={handleRetry}
        disabled={isLoading || retrying}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 14px',
          background: retrying ? '#f8514922' : 'transparent',
          border: '1px solid #f8514966',
          borderRadius: '6px',
          color: '#f85149',
          fontSize: '12px',
          fontWeight: 600,
          cursor: isLoading || retrying ? 'not-allowed' : 'pointer',
          opacity: isLoading || retrying ? 0.6 : 1,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isLoading && !retrying)
            e.currentTarget.style.background = '#f8514922';
        }}
        onMouseLeave={(e) => {
          if (!retrying) e.currentTarget.style.background = 'transparent';
        }}
      >
        {retrying ? '재시도 중...' : '🔄 다시 시도'}
      </button>
    </div>
  );
}
