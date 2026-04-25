'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', icon: '💬', label: '블로그 에이전트' },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: 'flex', gap: '4px' }}>
      {NAV_ITEMS.map(({ href, icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: active ? 700 : 400,
              color: active ? '#e6b84a' : '#8b949e',
              background: active ? '#e6b84a18' : 'transparent',
              border: active ? '1px solid #e6b84a44' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'color 0.15s, background 0.15s, border-color 0.15s',
            }}
          >
            <span>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
