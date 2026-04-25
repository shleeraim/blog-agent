'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAgentStore } from '@/lib/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { DraftResult } from '@/lib/types';

export function DraftCard({ data }: { data: DraftResult }) {
  const { reset } = useAgentStore();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.content);
    setCopied(true);
    toast('✅ 티스토리 에디터에 붙여넣기 하세요!', {
      duration: 3000,
      style: {
        background: '#161b22',
        border: '1px solid #56d36455',
        color: '#56d364',
        fontWeight: 600,
      },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = data.content.slice(0, 300);
  const hasMore = data.content.length > 300;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', color: '#484f58', fontWeight: 600, marginBottom: '4px' }}>META TITLE</p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#e6edf3', lineHeight: 1.4 }}>
            {data.meta_title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <StatBadge label="글자" value={`${data.word_count.toLocaleString()}자`} />
          <StatBadge label="태그" value={`${data.tags.length}개`} />
        </div>
      </div>

      {/* Meta desc */}
      <div
        style={{
          padding: '10px 12px',
          background: '#21262d',
          border: '1px solid #30363d',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#8b949e',
          lineHeight: 1.7,
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#484f58', display: 'block', marginBottom: '4px' }}>
          META DESCRIPTION
        </span>
        {data.meta_desc}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {data.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#21262d',
              border: '1px solid #30363d',
              color: '#58a6ff',
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Content preview */}
      <div
        style={{
          padding: '14px',
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#c9d1d9',
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
          maxHeight: expanded ? 'none' : '200px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {expanded ? data.content : preview}
        {!expanded && hasMore && (
          <div
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '60px',
              background: 'linear-gradient(transparent, #0d1117)',
            }}
          />
        )}
      </div>

      {/* Expand / Copy / Reset buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; }}
          >
            {expanded ? '▲ 접기' : '▼ 전체 보기'}
          </button>
        )}
        <button
          onClick={handleCopy}
          style={{
            ...ghostBtn,
            flex: 2,
            background: copied ? '#56d36422' : 'transparent',
            borderColor: copied ? '#56d364' : '#30363d',
            color: copied ? '#56d364' : '#8b949e',
          }}
        >
          {copied ? '✓ 복사됨' : '📋 마크다운 복사'}
        </button>

        {/* 새 주제 AlertDialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              style={{ ...ghostBtn, borderColor: '#f8514933', color: '#8b949e' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f85149'; e.currentTarget.style.color = '#f85149'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f8514933'; e.currentTarget.style.color = '#8b949e'; }}
            >
              🆕 새 주제
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>새 주제를 시작할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                현재 대화 내용이 모두 초기화됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={reset}>
                초기화 및 시작
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* SEO tips */}
      {data.seo_tips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            🔍 SEO 팁
          </p>
          {data.seo_tips.map((tip, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                background: '#1f6feb11',
                border: '1px solid #1f6feb22',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#8b949e',
                lineHeight: 1.6,
              }}
            >
              💡 {tip}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div
        style={{
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #58a6ff11, #bc8cff11)',
          border: '1px solid #58a6ff33',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#8b949e',
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        ✨ 초안이 완성됐습니다! 수정이 필요하면 아래 채팅창에 요청해주세요.
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  flex: 1,
  padding: '8px',
  background: 'transparent',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#8b949e',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '5px 10px',
        background: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '6px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '10px', color: '#484f58', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#e6edf3' }}>{value}</p>
    </div>
  );
}
