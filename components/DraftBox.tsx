'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import type { DraftResult, GeneratedImage, ImagePrompt } from '@/lib/types';
import { injectImagesIntoContent } from '@/lib/image/inject-images';

// ── Types ───────────────────────────────────────

interface DraftBoxProps {
  draft: DraftResult;
  generatedImages: GeneratedImage[];
  isGeneratingImages: boolean;
  imagePrompts?: ImagePrompt[];
  imageError?: string;
  onCopy: () => void;
  onRevise: () => void;
  onReset: () => void;
  onSaveToNotes: () => void;
  onRegenerateImage: (promptIndex: number) => void;
  onGenerateImages?: () => void;
}

// ── Failure Placeholder ────────────────────────

function FailurePlaceholder({
  aspectRatio,
  onRegenerate,
}: {
  aspectRatio: '16:9' | '1:1';
  onRegenerate: () => void;
}) {
  const isWide = aspectRatio === '16:9';
  return (
    <div
      style={{
        width: isWide ? '100%' : '140px',
        height: isWide ? undefined : '140px',
        paddingBottom: isWide ? '56.25%' : undefined,
        position: 'relative',
        background: '#21262d',
        border: '1px solid #d2992233',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: isWide ? 'absolute' : undefined,
          inset: isWide ? 0 : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <span style={{ fontSize: '11px', color: '#d29922', lineHeight: 1.4 }}>
          생성 실패 —<br />재생성 버튼을 눌러주세요
        </span>
        <button
          onClick={onRegenerate}
          style={{
            padding: '4px 10px',
            background: '#d2992222',
            border: '1px solid #d2992266',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#d29922',
            cursor: 'pointer',
          }}
        >
          🔄 재생성
        </button>
      </div>
    </div>
  );
}

// ── Image Gallery ───────────────────────────────

function ImageGallery({
  generatedImages,
  imagePrompts,
  onRegenerate,
}: {
  generatedImages: GeneratedImage[];
  imagePrompts?: ImagePrompt[];
  onRegenerate: (promptIndex: number) => void;
}) {
  const prompts = imagePrompts ?? [];
  const thumbnailPrompts = prompts.filter((p) => p.type === 'thumbnail');
  const contentPrompts = prompts.filter((p) => p.type === 'content');

  const findImg = (p: ImagePrompt) =>
    generatedImages.find(
      (img) => img.type === p.type && img.insertAfterSection === p.insertAfterSection
    );

  // Fallback: no imagePrompts — render generatedImages directly
  if (prompts.length === 0) {
    const thumbs = generatedImages.filter((img) => img.type === 'thumbnail');
    const content = generatedImages.filter((img) => img.type === 'content');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {thumbs.map((img, i) => (
          <div key={i}>
            <SectionLabel>📸 썸네일 (16:9)</SectionLabel>
            <ImageCard img={img} onRegenerate={() => onRegenerate(i)} />
          </div>
        ))}
        {content.length > 0 && (
          <div>
            <SectionLabel>🖼️ 본문용 이미지 (1:1)</SectionLabel>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {content.map((img, i) => (
                <ContentCard
                  key={i}
                  img={img}
                  onRegenerate={() => onRegenerate(thumbs.length + i)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 썸네일 (16:9) */}
      {thumbnailPrompts.map((prompt) => {
        const promptIndex = prompts.indexOf(prompt);
        const img = findImg(prompt);
        return (
          <div key={promptIndex}>
            <SectionLabel>📸 썸네일 (16:9)</SectionLabel>
            {img ? (
              <ImageCard img={img} onRegenerate={() => onRegenerate(promptIndex)} />
            ) : (
              <FailurePlaceholder aspectRatio="16:9" onRegenerate={() => onRegenerate(promptIndex)} />
            )}
          </div>
        );
      })}

      {/* 본문용 이미지 (1:1) */}
      {contentPrompts.length > 0 && (
        <div>
          <SectionLabel>🖼️ 본문용 이미지 (1:1)</SectionLabel>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {contentPrompts.map((prompt) => {
              const promptIndex = prompts.indexOf(prompt);
              const img = findImg(prompt);
              return img ? (
                <ContentCard key={promptIndex} img={img} onRegenerate={() => onRegenerate(promptIndex)} />
              ) : (
                <FailurePlaceholder
                  key={promptIndex}
                  aspectRatio="1:1"
                  onRegenerate={() => onRegenerate(promptIndex)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', color: '#8b949e', fontWeight: 600,
      marginBottom: '8px', fontFamily: "'DM Mono', monospace",
    }}>
      {children}
    </div>
  );
}

function ImageCard({ img, onRegenerate }: { img: GeneratedImage; onRegenerate: () => void }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <img
        src={img.url}
        alt={img.altText}
        style={{ width: '100%', borderRadius: '8px', display: 'block' }}
      />
      <button
        onClick={onRegenerate}
        style={{
          position: 'absolute', bottom: '8px', right: '8px',
          padding: '5px 10px', background: '#0d111799',
          border: '1px solid #58a6ff88', borderRadius: '6px',
          fontSize: '11px', color: '#58a6ff', cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        🔄 재생성
      </button>
    </div>
  );
}

function ContentCard({ img, onRegenerate }: { img: GeneratedImage; onRegenerate: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '140px', flexShrink: 0 }}>
      <div style={{ position: 'relative' }}>
        <img
          src={img.url}
          alt={img.altText}
          style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
        />
        <button
          onClick={onRegenerate}
          style={{
            position: 'absolute', bottom: '4px', right: '4px',
            padding: '3px 7px', background: '#0d111799',
            border: '1px solid #58a6ff88', borderRadius: '4px',
            fontSize: '10px', color: '#58a6ff', cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          🔄
        </button>
      </div>
      <span style={{
        fontSize: '10px', color: '#484f58',
        overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', maxWidth: '140px',
      }}>
        {img.altText}
      </span>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────

function ImageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        fontSize: '11px', color: '#484f58', fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
      }}>
        🎨 이미지 생성 중...
      </div>
      <div className="animate-pulse" style={{ width: '100%', paddingBottom: '56.25%', background: '#21262d', borderRadius: '8px' }} />
      <div style={{ display: 'flex', gap: '10px' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse" style={{ width: '100px', height: '100px', background: '#21262d', borderRadius: '6px', flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ── Publish Checklist ───────────────────────────

interface CheckItem {
  label: string;
  pass: boolean;
  detail: string;
}

function buildChecklist(
  draft: DraftResult,
  generatedImages: GeneratedImage[]
): CheckItem[] {
  const titleLen = draft.meta_title.length;
  const cleanTags = (draft.tags ?? []).map((t) => t.replace(/^#+/, ''));
  const hasTagHash = (draft.tags ?? []).some((t) => t.startsWith('#'));
  const tagCount = cleanTags.length;
  const internalLinkCount = (draft.content.match(/(?<!!)\[[^\]]+\]\([^)]+\)/g) ?? []).length;
  const charCount = draft.content.length;
  const hasClosing =
    draft.content.includes('구독과 즐겨찾기') || draft.content.includes('관련 글 보기');

  return [
    {
      label: '제목 길이 35~50자',
      pass: titleLen >= 35 && titleLen <= 50,
      detail: `현재 ${titleLen}자`,
    },
    {
      label: '태그 # 없음',
      pass: !hasTagHash,
      detail: hasTagHash ? '태그에 # 포함됨 (자동 제거됨)' : '정상',
    },
    {
      label: '태그 수 5~8개',
      pass: tagCount >= 5 && tagCount <= 8,
      detail: `현재 ${tagCount}개`,
    },
    {
      label: '카테고리 지정',
      pass: !!draft.category && draft.category !== '카테고리 없음',
      detail: draft.category || '미지정',
    },
    {
      label: '이미지 1장 이상',
      pass: generatedImages.length > 0,
      detail: generatedImages.length > 0 ? `${generatedImages.length}장` : '없음',
    },
    {
      label: '내부 링크 2개 이상',
      pass: internalLinkCount >= 2,
      detail: `${internalLinkCount}개 감지`,
    },
    {
      label: '본문 1,500자 이상',
      pass: charCount >= 1500,
      detail: `현재 ${charCount.toLocaleString()}자`,
    },
    {
      label: '마무리 섹션 포함',
      pass: hasClosing,
      detail: hasClosing ? '포함됨' : '미포함',
    },
  ];
}

function PublishChecklist({
  draft,
  generatedImages,
}: {
  draft: DraftResult;
  generatedImages: GeneratedImage[];
}) {
  const [open, setOpen] = useState(false);
  const items = buildChecklist(draft, generatedImages);
  const failCount = items.filter((i) => !i.pass).length;
  const allPass = failCount === 0;

  return (
    <div style={{ border: `1px solid ${allPass ? '#56d36433' : '#d2992233'}`, borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: allPass ? '#56d36410' : '#d2992210',
          border: 'none', cursor: 'pointer', gap: '8px',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: allPass ? '#56d364' : '#d29922', fontFamily: "'DM Mono', monospace" }}>
          {allPass ? '✅ 발행 준비 완료' : `⚠️ ${failCount}개 항목 미충족`}
        </span>
        <span style={{ fontSize: '10px', color: '#484f58' }}>{open ? '▲ 접기' : '▼ 체크리스트 보기'}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 12px', background: '#161b22', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {items.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <span style={{ width: '14px', textAlign: 'center', flexShrink: 0 }}>
                {item.pass ? '✓' : '✗'}
              </span>
              <span style={{ color: item.pass ? '#8b949e' : '#e6edf3', flex: 1 }}>{item.label}</span>
              <span style={{ color: item.pass ? '#484f58' : '#d29922', fontFamily: "'DM Mono', monospace", fontSize: '10px' }}>
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────

export function DraftBox({
  draft,
  generatedImages,
  isGeneratingImages,
  imagePrompts,
  imageError,
  onCopy,
  onRevise,
  onReset,
  onSaveToNotes,
  onRegenerateImage,
  onGenerateImages,
}: DraftBoxProps) {
  const [copied, setCopied] = useState(false);
  const [copiedWithImages, setCopiedWithImages] = useState(false);

  const hasImages = generatedImages.length > 0;
  const hasImagePrompts = (imagePrompts?.length ?? 0) > 0;
  const showImageSection = isGeneratingImages || hasImages || hasImagePrompts || !!imageError;

  const contentWithImages = hasImages
    ? injectImagesIntoContent(draft.content, generatedImages)
    : draft.content;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft.content);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyWithImages = async () => {
    const injected = injectImagesIntoContent(draft.content, generatedImages);
    await navigator.clipboard.writeText(injected);
    setCopiedWithImages(true);

    const bytes = new TextEncoder().encode(injected).length;
    const mb = bytes / (1024 * 1024);
    if (mb > 1) {
      toast('📋 복사 완료! 이미지가 포함된 대용량 데이터입니다. 티스토리 붙여넣기 시 시간이 걸릴 수 있습니다.', { duration: 5000 });
    } else {
      toast.success('이미지 포함 전체 복사됨! 티스토리에 바로 붙여넣기 가능합니다.', { duration: 3000 });
    }
    setTimeout(() => setCopiedWithImages(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', background: '#1c2330', border: '1px solid #30363d', borderRadius: '12px' }}>

      {/* 상단: 뱃지 + 카테고리 + 메타 제목 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '20px',
            background: '#56d36422', border: '1px solid #56d36444',
            fontSize: '11px', color: '#56d364', fontWeight: 600,
            fontFamily: "'DM Mono', monospace",
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#56d364', display: 'inline-block' }} />
            DRAFT COMPLETE
          </div>
          {draft.category && (
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: '20px',
              background: '#388bfd18', border: '1px solid #388bfd44',
              fontSize: '11px', color: '#388bfd', fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
            }}>
              📂 {draft.category}
            </div>
          )}
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e6edf3', lineHeight: 1.45, fontFamily: "'Noto Serif KR', serif" }}>
          {draft.meta_title}
        </h2>
      </div>

      {/* 태그 배지 (# 방어 처리) */}
      {draft.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {draft.tags.map((tag) => {
            const cleanTag = tag.replace(/^#+/, '');
            return (
              <span key={cleanTag} style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: '#e6b84a18', border: '1px solid #e6b84a55', color: '#e6b84a' }}>
                #{cleanTag}
              </span>
            );
          })}
        </div>
      )}

      {/* 발행 전 체크리스트 */}
      <PublishChecklist draft={draft} generatedImages={generatedImages} />

      {/* 이미지 섹션 */}
      {showImageSection && (
        <div style={{ padding: '14px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}>
          {imageError ? (
            <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.6 }}>
              <span style={{ color: '#d29922' }}>⚠️</span> {imageError}
            </div>
          ) : isGeneratingImages ? (
            <ImageSkeleton />
          ) : hasImages || hasImagePrompts ? (
            <ImageGallery
              generatedImages={generatedImages}
              imagePrompts={imagePrompts}
              onRegenerate={onRegenerateImage}
            />
          ) : null}
        </div>
      )}

      {/* 이미지 자동 생성 버튼 (이미지 없고 오류 없을 때) */}
      {!isGeneratingImages && !hasImages && !hasImagePrompts && !imageError && onGenerateImages && (
        <button
          onClick={onGenerateImages}
          style={{
            padding: '10px 14px',
            background: '#388bfd14',
            border: '1px solid #388bfd44',
            borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            color: '#388bfd', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#388bfd22')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#388bfd14')}
        >
          🎨 이미지 자동 생성
        </button>
      )}

      {/* 본문 마크다운 */}
      <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', fontSize: '13px', color: '#e6edf3', lineHeight: 1.85 }}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '20px', color: '#e6edf3', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '16px', color: '#e6b84a', fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: '14px', color: '#c9d1d9', fontWeight: 600, marginTop: '14px', marginBottom: '6px' }}>{children}</h3>,
            p: ({ children }) => <p style={{ marginBottom: '10px', color: '#c9d1d9' }}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: '#e6edf3', fontWeight: 700 }}>{children}</strong>,
            ul: ({ children }) => <ul style={{ paddingLeft: '18px', marginBottom: '10px', color: '#c9d1d9' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: '18px', marginBottom: '10px', color: '#c9d1d9' }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: '4px', lineHeight: 1.75 }}>{children}</li>,
            code: ({ children }) => <code style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', background: '#1c2330', padding: '1px 6px', borderRadius: '3px', color: '#e6b84a' }}>{children}</code>,
            blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #e6b84a', paddingLeft: '12px', color: '#8b949e', margin: '10px 0', fontStyle: 'italic' }}>{children}</blockquote>,
            img: ({ src, alt }) => {
              const genImg = generatedImages.find((img) => img.url === src);
              const isWide = genImg?.aspectRatio === '16:9';
              return (
                <img src={src ?? ''} alt={alt ?? ''} style={{ width: isWide ? '100%' : '60%', display: 'block', margin: isWide ? '16px 0' : '16px auto', borderRadius: '8px' }} />
              );
            },
          }}
        >
          {contentWithImages}
        </ReactMarkdown>
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <div style={{ display: 'flex', gap: '7px' }}>
          {hasImages && (
            <button
              onClick={handleCopyWithImages}
              style={{
                flex: 3, padding: '10px 12px',
                background: copiedWithImages ? 'linear-gradient(135deg, #56d364, #3fb950)' : 'linear-gradient(135deg, #388bfd, #1f6feb)',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {copiedWithImages ? '✅ 복사됨!' : '🖼️ 이미지 포함 전체 복사'}
            </button>
          )}
          <button
            onClick={handleCopy}
            style={{
              flex: hasImages ? 2 : 3, padding: '10px 12px',
              background: copied ? 'linear-gradient(135deg, #56d364, #3fb950)' : 'linear-gradient(135deg, #e6b84a, #c9953a)',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              color: '#0d1117', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copied ? '✅ 복사됨!' : '📋 텍스트만 복사'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            onClick={onSaveToNotes}
            style={ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; }}
          >
            🍎 Notes 저장{hasImages ? ` (+${generatedImages.length}장)` : ''}
          </button>
          <button
            onClick={onRevise}
            style={ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.color = '#e6edf3'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e'; }}
          >
            🔄 수정
          </button>
          <button
            onClick={onReset}
            style={{ ...ghostBtn, borderColor: '#f8514944' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f85149'; e.currentTarget.style.color = '#f85149'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f8514944'; e.currentTarget.style.color = '#8b949e'; }}
          >
            🆕 새 주제
          </button>
        </div>
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  flex: 1, padding: '10px 10px',
  background: 'transparent',
  border: '1px solid #30363d', borderRadius: '8px',
  fontSize: '12px', color: '#8b949e', cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
};
