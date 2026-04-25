'use client';

import type { Settings } from '@/lib/types';

interface SidebarProps {
  settings: Settings;
  onSettingsChange: (s: Partial<Settings>) => void;
}

const CATEGORIES = [
  'ETF/펀드', '예금/적금', '부동산', '주식',
  'ISA/연금', '절세', '해외투자', '가상자산',
];

const LEVEL_OPTIONS: { value: Settings['level']; label: string }[] = [
  { value: 'all',          label: '전 수준 포괄' },
  { value: 'beginner',     label: '입문자' },
  { value: 'intermediate', label: '중급 투자자' },
  { value: 'advanced',     label: '고급 투자자' },
];

const LENGTH_OPTIONS: { value: Settings['length']; label: string }[] = [
  { value: 'short',  label: '짧게 (800~1200자)' },
  { value: 'medium', label: '보통 (1500~2500자)' },
  { value: 'long',   label: '길게 (3000자+)' },
];

const TOGGLE_ITEMS: { key: keyof Pick<Settings, 'useSearch' | 'useSeo' | 'useFormat'>; label: string; desc: string }[] = [
  { key: 'useSearch', label: '최신 정보 검색', desc: '웹 검색 도구 사용' },
  { key: 'useSeo',    label: 'SEO 최적화',    desc: '키워드 자동 배치' },
  { key: 'useFormat', label: '티스토리 서식',  desc: '마크다운 포맷 적용' },
];

export function Sidebar({ settings, onSettingsChange }: SidebarProps) {
  const toggleCat = (cat: string) => {
    const has = settings.categories.includes(cat);
    onSettingsChange({
      categories: has
        ? settings.categories.filter((c) => c !== cat)
        : [...settings.categories, cat],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>

      {/* 로고 영역 */}
      <div style={{ paddingTop: '4px' }}>
        <p style={sectionLabel}>카테고리</p>
        <p style={{ fontSize: '10px', color: '#484f58', marginBottom: '10px' }}>
          {settings.categories.length === 0 ? '전체 선택됨' : `${settings.categories.length}개 선택`}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CATEGORIES.map((cat) => {
            const active = settings.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                style={{
                  padding: '4px 11px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  background: active ? '#e6b84a18' : 'transparent',
                  border: `1px solid ${active ? '#e6b84a' : '#30363d'}`,
                  color: active ? '#e6b84a' : '#8b949e',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '-0.1px',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 기능 토글 */}
      <div>
        <p style={sectionLabel}>기능</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {TOGGLE_ITEMS.map(({ key, label, desc }) => {
            const on = settings[key] as boolean;
            return (
              <div
                key={key}
                onClick={() => onSettingsChange({ [key]: !on })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 11px',
                  background: '#1c2330', border: '1px solid #30363d',
                  borderRadius: '7px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#e6b84a44')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#30363d')}
              >
                <div>
                  <p style={{ fontSize: '12px', color: '#e6edf3', fontWeight: on ? 600 : 400, marginBottom: '1px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '10px', color: '#484f58' }}>{desc}</p>
                </div>
                {/* Switch */}
                <div
                  style={{
                    width: '34px', height: '19px', borderRadius: '10px',
                    background: on ? '#e6b84a' : '#30363d',
                    position: 'relative', flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute', top: '3px',
                      left: on ? '18px' : '3px',
                      width: '13px', height: '13px',
                      borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 독자 수준 */}
      <div>
        <p style={sectionLabel}>독자 수준</p>
        <select
          value={settings.level}
          onChange={(e) => onSettingsChange({ level: e.target.value as Settings['level'] })}
          style={selectStyle}
        >
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 글 길이 */}
      <div>
        <p style={sectionLabel}>글 길이</p>
        <select
          value={settings.length}
          onChange={(e) => onSettingsChange({ length: e.target.value as Settings['length'] })}
          style={selectStyle}
        >
          {LENGTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── 스타일 상수 ──
const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.9px',
  color: '#484f58',
  marginBottom: '10px',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  background: '#1c2330',
  border: '1px solid #30363d',
  borderRadius: '7px',
  color: '#e6edf3',
  fontSize: '12px',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%238b949e' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
};
