'use client';

import { useAgentStore } from '@/lib/store';
import type { Settings } from '@/lib/types';

const ALL_CATEGORIES = [
  'ETF/펀드', '예금/적금', '부동산', '주식',
  'ISA/연금', '절세', '해외투자', '암호화폐', '대출/금리',
];

const LEVELS: { value: Settings['level']; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'beginner', label: '입문' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

const LENGTHS: { value: Settings['length']; label: string; desc: string }[] = [
  { value: 'short', label: '짧게', desc: '800~1200자' },
  { value: 'medium', label: '보통', desc: '1500~2500자' },
  { value: 'long', label: '길게', desc: '3000자+' },
];

export function LeftSidebar() {
  const { settings, updateSettings } = useAgentStore();

  const toggleCategory = (cat: string) => {
    const exists = settings.categories.includes(cat);
    updateSettings({
      categories: exists
        ? settings.categories.filter((c) => c !== cat)
        : [...settings.categories, cat],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>

      {/* 카테고리 */}
      <Section title="카테고리">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ALL_CATEGORIES.map((cat) => {
            const active = settings.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  background: active ? '#1f6feb22' : 'transparent',
                  border: `1px solid ${active ? '#58a6ff' : '#30363d'}`,
                  color: active ? '#58a6ff' : '#8b949e',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: '10px', color: '#484f58', marginTop: '4px' }}>
          {settings.categories.length === 0
            ? '전체 카테고리'
            : `${settings.categories.length}개 선택됨`}
        </p>
      </Section>

      {/* 독자 수준 */}
      <Section title="독자 수준">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {LEVELS.map(({ value, label }) => {
            const active = settings.level === value;
            return (
              <button
                key={value}
                onClick={() => updateSettings({ level: value })}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 400,
                  background: active ? '#1f6feb22' : '#21262d',
                  border: `1px solid ${active ? '#58a6ff' : '#30363d'}`,
                  color: active ? '#58a6ff' : '#8b949e',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 글 길이 */}
      <Section title="글 길이">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {LENGTHS.map(({ value, label, desc }) => {
            const active = settings.length === value;
            return (
              <button
                key={value}
                onClick={() => updateSettings({ length: value })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: active ? '#1f6feb22' : '#21262d',
                  border: `1px solid ${active ? '#58a6ff' : '#30363d'}`,
                  color: active ? '#58a6ff' : '#8b949e',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span>{label}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>{desc}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 기능 토글 */}
      <Section title="기능">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Toggle
            label="🔍 최신 정보 검색"
            desc="web_search 도구 활성화"
            checked={settings.useSearch}
            onChange={(v) => updateSettings({ useSearch: v })}
          />
          <Toggle
            label="📈 SEO 최적화"
            desc="키워드 배치 최적화"
            checked={settings.useSeo}
            onChange={(v) => updateSettings({ useSeo: v })}
          />
          <Toggle
            label="✏️ 마크다운 서식"
            desc="소제목/강조/목록 사용"
            checked={settings.useFormat}
            onChange={(v) => updateSettings({ useFormat: v })}
          />
        </div>
      </Section>
    </div>
  );
}

// ── 내부 헬퍼 ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px',
        textTransform: 'uppercase', color: '#484f58',
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Toggle({
  label, desc, checked, onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px',
        background: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onClick={() => onChange(!checked)}
    >
      <div>
        <p style={{ fontSize: '12px', color: '#c9d1d9', fontWeight: checked ? 600 : 400 }}>{label}</p>
        <p style={{ fontSize: '10px', color: '#484f58' }}>{desc}</p>
      </div>
      {/* Toggle switch */}
      <div
        style={{
          width: '32px', height: '18px',
          borderRadius: '9px',
          background: checked ? '#1f6feb' : '#30363d',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '17px' : '3px',
            width: '12px', height: '12px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </div>
  );
}
