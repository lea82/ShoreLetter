'use client'

import Link from 'next/link'

const C = {
  tide:  '#4a8fa8',
  stone: '#7a8a94',
}

const cn   = 'var(--font-noto-serif-sc), serif'
const mono = 'var(--font-dm-mono), monospace'

export function BottomNav({ active }: { active: 'shore' | 'write' | 'profile' }) {
  return (
    <nav style={{
      borderTop: '1px solid rgba(0,0,0,0.06)',
      background: 'rgba(245,240,232,0.97)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      padding: '8px 0',
      position: 'sticky',
      bottom: 0,
    }}>
      {[
        { href: '/shore',   label: '岸边', en: 'Shore',   id: 'shore'   },
        { href: '/write',   label: '写信', en: 'Write',   id: 'write'   },
        { href: '/profile', label: '我的', en: 'Profile', id: 'profile' },
      ].map(item => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            padding: '6px 0', textDecoration: 'none',
            color: item.id === active ? C.tide : C.stone,
          }}
        >
          <span style={{ fontFamily: cn, fontSize: 13, fontWeight: 700 }}>
            {item.label}
          </span>
          <span style={{
            fontFamily: mono, fontSize: 8,
            letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6,
          }}>
            {item.en}
          </span>
        </Link>
      ))}
    </nav>
  )
}
