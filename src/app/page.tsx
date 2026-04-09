'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

const C = {
  sand:     '#f5f0e8',
  tide:     '#4a8fa8',
  tideDark: '#2e6e8a',
  deep:     '#1a2e3b',
  stone:    '#7a8a94',
}

function BottleSVG() {
  return (
    <motion.svg
      viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: 32, height: 48, flexShrink: 0 }}
      animate={{ y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] }}
      transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
    >
      <path d="M32 10 L32 22 Q20 30 16 47 L16 96 Q16 110 40 110 Q64 110 64 96 L64 47 Q60 30 48 22 L48 10 Z"
        fill="rgba(200,221,232,0.35)" stroke="rgba(74,143,168,0.6)" strokeWidth="1.5"/>
      <path d="M30 10 L50 10 L50 8 Q50 3 40 3 Q30 3 30 8 Z"
        fill="rgba(184,148,63,0.7)" stroke="rgba(184,148,63,0.9)" strokeWidth="1"/>
      <path d="M20 66 Q40 60 60 66" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
      <rect x="28" y="82" width="24" height="20" rx="1"
        fill="rgba(245,240,232,0.25)" stroke="rgba(245,240,232,0.4)" strokeWidth="0.5"/>
      <line x1="32" y1="87" x2="48" y2="87" stroke="rgba(245,240,232,0.6)" strokeWidth="0.5"/>
      <line x1="32" y1="91" x2="45" y2="91" stroke="rgba(245,240,232,0.5)" strokeWidth="0.5"/>
    </motion.svg>
  )
}

const features = [
  {
    icon: '🍶', cn: '放漂一封信', en: 'Release a letter',
    desc: '写下你想说的，让信漂向未知。不需要真名，不需要照片。',
  },
  {
    icon: '🌊', cn: '星期三潮汐', en: 'Wednesday Tide',
    desc: '每周三晚8点，所有信统一配对。等待，是仪式的一部分。',
  },
  {
    icon: '💌', cn: '成为笔友', en: 'Become pen pals',
    desc: '一封信开始，慢慢相知。信件妥善保存，留作一段记忆。',
  },
]

export default function LandingPage() {
  

  const serif   = 'var(--font-baskerville), Georgia, serif'
  const cn      = 'var(--font-noto-serif-sc), serif'
  const mono    = 'var(--font-dm-mono), monospace'

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #f5f0e8 0%, #ddeaf2 100%)',
      overflowX: 'hidden',
    }}>

      {/* NAV */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', maxWidth: 960, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: cn, fontWeight: 900, fontSize: 20, color: C.deep, letterSpacing: '0.04em' }}>
            岸信
          </span>
          <span style={{ color: C.stone, opacity: 0.4 }}>·</span>
          <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: C.stone }}>
            Shore Letter
          </span>
        </div>
        <Link href="/auth" style={{
          fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: C.tideDark, border: '1px solid rgba(74,143,168,0.3)',
          padding: '8px 16px', textDecoration: 'none',
        }}>
          登录
        </Link>
      </nav>

      {/* HERO */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '36px 24px 56px',
        maxWidth: 460, margin: '0 auto',
      }}>

        {/* Bottle + eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}
        >
          <BottleSVG />
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.tide }}>
            重建漂流瓶
          </span>
        </motion.div>

        {/* 岸信 */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            fontFamily: cn, fontWeight: 900,
            fontSize: 'clamp(48px, 14vw, 72px)',
            lineHeight: 1.1, color: C.deep,
            letterSpacing: '0.04em', margin: '0 0 8px',
          }}
        >
          岸信
        </motion.h1>

        {/* Shore Letter */}
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 17, color: C.stone, margin: '0 0 24px' }}
        >
          Shore Letter
        </motion.p>

        {/* Taglines */}
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ fontSize: 16, color: C.deep + 'bb', margin: '0 0 6px', lineHeight: 1.65 }}
        >
          写给陌生人，让潮水决定。
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5 }}
          style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: C.stone + 'bb', margin: '0 0 36px' }}
        >
          Write to a stranger. Let the tide decide.
        </motion.p>
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.5 }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <Link href="/auth" style={{
            display: 'block', textAlign: 'center',
            background: C.tide, color: 'white',
            padding: '14px 24px', textDecoration: 'none',
            fontFamily: cn, fontSize: 15, letterSpacing: '0.1em',
          }}>
            开始漂流 →
          </Link>
          <p style={{
            fontFamily: mono, fontSize: 9, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: C.stone + '80',
            textAlign: 'center', margin: 0,
          }}>
            让你的话 · 找到愿意听的人
          </p>
        </motion.div>
      </section>
        

      {/* DIVIDER */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
      </div>

      {/* FEATURES */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 1, background: 'rgba(0,0,0,0.05)',
        }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{ background: C.sand, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <div>
                <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 14, color: C.deep, margin: '0 0 3px' }}>
                  {f.cn}
                </p>
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 11, color: C.stone, margin: 0 }}>
                  {f.en}
                </p>
              </div>
              <p style={{ fontSize: 12, color: C.deep + '88', lineHeight: 1.65, margin: 0 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section style={{ maxWidth: 480, margin: '0 auto', padding: '8px 24px 48px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <p style={{
            fontFamily: serif, fontStyle: 'italic', fontSize: 15,
            color: C.deep + '88', lineHeight: 1.75, margin: '0 0 12px',
          }}>
            "我不是在找伴侣，也不需要治疗。<br />
            我只是想有一个人，知道我今天的心情。"
          </p>
          <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.stone + '80', margin: 0 }}>
            — 某个安静的陌生人
          </p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '20px 24px' }}>
        <div style={{
          maxWidth: 720, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: cn, fontWeight: 700, fontSize: 14, color: C.deep }}>岸信</span>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', color: C.stone + '80' }}>
              · shoreletter.app
            </span>
          </div>
          <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', color: C.stone + '70', margin: 0 }}>
            © 2026 Shore Letter · 真实的人，真实的信
          </p>
        </div>
      </footer>

    </div>
  )
}
