'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const C = {
  sand:     '#f5f0e8',
  sand2:    '#ede6d6',
  tide:     '#4a8fa8',
  tideDark: '#2e6e8a',
  deep:     '#1a2e3b',
  stone:    '#7a8a94',
  water:    '#c8dde8',
}

const serif = 'var(--font-baskerville), Georgia, serif'
const cn    = 'var(--font-noto-serif-sc), serif'
const mono  = 'var(--font-dm-mono), monospace'

type Correspondence = {
  id:             string
  user_a_id:      string
  user_b_id:      string
  is_ai_fallback: boolean
  letter_count:   number
  last_letter_at: string | null
  created_at:     string
  status:         string
  partner: {
    id:         string
    alias:      string
    avatar_url: string | null
  }
  last_letter_preview?: string
}

function relativeDate(date: string): string {
  const diff  = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return '刚刚'
  if (mins < 60)  return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7)   return `${days}天前`
  return new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function WednesdayBanner() {
  const now        = new Date()
  const isWed      = now.getDay() === 3
  const isPast8pm  = now.getHours() >= 20
  if (!isWed) return null

  return (
    <div style={{
      margin: '0 16px 12px',
      padding: '12px 16px',
      border: '1px solid rgba(74,143,168,0.25)',
      background: 'rgba(74,143,168,0.04)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>🌊</span>
      <div>
        <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 13,
                    color: C.deep, margin: '0 0 2px' }}>
          星期三潮汐
        </p>
        <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: C.tide, margin: 0 }}>
          {isPast8pm ? '今晚的信已漂出，等待配对中…' : '今晚8点，新的信漂来'}
        </p>
      </div>
    </div>
  )
}

function CorrespondenceCard({
  corr,
  currentUserId,
}: {
  corr: Correspondence
  currentUserId: string
}) {
  const isAI   = corr.is_ai_fallback
  const isNew  = corr.letter_count <= 1
  const days   = Math.floor((Date.now() - new Date(corr.created_at).getTime()) / 86400000)

  return (
    <Link href={`/letters/${corr.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 16px',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        background: isNew ? 'rgba(74,143,168,0.02)' : 'transparent',
        cursor: 'pointer',
      }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          border: `1px solid ${isNew ? 'rgba(74,143,168,0.3)' : 'rgba(122,138,148,0.2)'}`,
          background: C.sand2, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {isAI ? '🤖'
            : corr.partner.avatar_url
              ? <img src={corr.partner.avatar_url} alt=""
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🌊'
          }
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'baseline', marginBottom: 4 }}>
            <p style={{
              fontFamily: cn, fontWeight: 700, fontSize: 14,
              color: isAI ? C.stone : C.deep,
              margin: 0, fontStyle: isAI ? 'italic' : 'normal',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '70%',
            }}>
              {isAI ? 'AI伴侣 · 等待中' : corr.partner.alias}
            </p>
            <span style={{ fontFamily: mono, fontSize: 9, color: C.stone + '99',
                           letterSpacing: '0.08em', flexShrink: 0, marginLeft: 8 }}>
              {corr.last_letter_at ? relativeDate(corr.last_letter_at) : '刚刚'}
            </span>
          </div>

          <p style={{
            fontFamily: serif, fontStyle: 'italic', fontSize: 12,
            color: C.stone + 'bb', margin: '0 0 6px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {corr.last_letter_preview || '…'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 9, color: C.stone + '80',
                           letterSpacing: '0.08em' }}>
              {corr.letter_count} 封信
            </span>
            {days > 0 && (
              <span style={{ fontFamily: mono, fontSize: 9,
                             color: C.stone + '60', letterSpacing: '0.08em' }}>
                · {days} 天
              </span>
            )}
            {isNew && (
              <span style={{ fontFamily: mono, fontSize: 9, color: C.tide,
                             letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                · 新信
              </span>
            )}
          </div>
        </div>

        {/* Unread dot */}
        {isNew && (
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: C.tide, flexShrink: 0, marginTop: 6,
          }} />
        )}
      </div>
    </Link>
  )
}

function EmptyShore() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 32px', textAlign: 'center',
    }}>
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 44, marginBottom: 20 }}
      >
        🍶
      </motion.div>
      <p style={{ fontFamily: cn, fontSize: 16, color: C.deep + '80',
                  margin: '0 0 6px' }}>
        海岸今晚很安静。
      </p>
      <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13,
                  color: C.stone + '99', margin: '0 0 28px' }}>
        The shore is quiet tonight.
      </p>
      <Link href="/write" style={{
        background: C.tide, color: 'white', textDecoration: 'none',
        padding: '14px 32px',
        fontFamily: cn, fontSize: 14, letterSpacing: '0.1em',
      }}>
        写第一封信
      </Link>
    </div>
  )
}

// Shared bottom nav component
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

export default function ShorePage() {
  const router = useRouter()
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([])
  const [currentUserId, setCurrentUserId]     = useState<string | null>(null)
  const [loading, setLoading]                 = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!profile) { router.push('/onboard'); return }
      setCurrentUserId(profile.id)

      const { data: corrData } = await supabase
        .from('correspondences')
        .select('id, user_a_id, user_b_id, is_ai_fallback, letter_count, last_letter_at, created_at, status')
        .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
        .eq('status', 'active')
        .order('last_letter_at', { ascending: false, nullsFirst: false })

      if (!corrData) { setLoading(false); return }

      const enriched: Correspondence[] = await Promise.all(
        corrData.map(async (corr) => {
          const partnerId = corr.user_a_id === profile.id ? corr.user_b_id : corr.user_a_id

          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('id, alias, avatar_url')
            .eq('id', partnerId)
            .single()

          const { data: lastLetter } = await supabase
            .from('letters')
            .select('content')
            .eq('correspondence_id', corr.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const preview = lastLetter?.content
            ? lastLetter.content.slice(0, 60) + (lastLetter.content.length > 60 ? '…' : '')
            : undefined

          return {
            ...corr,
            partner: partnerProfile ?? { id: partnerId, alias: '神秘漂流者', avatar_url: null },
            last_letter_preview: preview,
          }
        })
      )

      setCorrespondences(enriched)
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.sand,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(245,240,232,0.93)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontFamily: cn, fontWeight: 900, fontSize: 20,
                       color: C.deep, margin: 0, letterSpacing: '0.03em' }}>
            岸边
          </h1>
          <p style={{ fontFamily: mono, fontSize: 9, color: C.stone,
                      letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
            The Shore
          </p>
        </div>
        <Link href="/write" style={{
          width: 40, height: 40, background: C.tide,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', fontSize: 18,
        }}>
          ✏️
        </Link>
      </header>

      {/* Wednesday Banner */}
      <div style={{ paddingTop: 12 }}>
        <WednesdayBanner />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.p
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontFamily: cn, color: C.stone, fontSize: 14 }}
          >
            潮水正在涌来…
          </motion.p>
        </div>
      ) : correspondences.length === 0 ? (
        <EmptyShore />
      ) : (
        <div style={{ flex: 1 }}>
          <AnimatePresence>
            {correspondences.map((corr, i) => (
              <motion.div
                key={corr.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CorrespondenceCard corr={corr} currentUserId={currentUserId ?? ''} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <BottomNav active="shore" />
    </div>
  )
}
