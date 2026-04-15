'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BottomNav } from '@/components/BottomNav'

type CorrespondenceRow = {
  id: string
  user_a_id: string
  user_b_id: string
  is_ai_fallback: boolean
  letter_count: number
  last_letter_at: string | null
  created_at: string
  status: string
  last_read_by_a_at?: string | null
  last_read_by_b_at?: string | null
}

type CorrespondenceCardData = CorrespondenceRow & {
  partner: {
    id: string
    alias: string
    avatar_url: string | null
  }
  last_letter_preview?: string
  unread: boolean
}

const C = {
  sand: '#f5f0e8',
  sand2: '#ede6d6',
  tide: '#4a8fa8',
  tideDark: '#2e6e8a',
  deep: '#1a2e3b',
  stone: '#7a8a94',
  water: '#c8dde8',
}

const serif = 'var(--font-baskerville), Georgia, serif'
const cn = 'var(--font-noto-serif-sc), serif'
const mono = 'var(--font-dm-mono), monospace'

function relativeDate(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function WednesdayBanner() {
  const now = new Date()
  const isWed = now.getDay() === 3
  const isPast8pm = now.getHours() >= 20

  if (!isWed) return null

  return (
    <div
      style={{
        border: '1px solid rgba(74,143,168,0.18)',
        background: 'rgba(200,221,232,0.24)',
        padding: '14px 16px',
      }}
    >
      <div style={{ fontFamily: cn, fontWeight: 700, color: C.deep, marginBottom: 4 }}>星期三潮汐</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.stone, letterSpacing: '0.08em' }}>
        {isPast8pm ? '今晚的信已漂出，等待配对中…' : '今晚 8 点，新的信漂来'}
      </div>
    </div>
  )
}

function Avatar({ alias, avatarUrl, isAI }: { alias: string; avatarUrl: string | null; isAI: boolean }) {
  if (isAI) {
    return (
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          background: 'rgba(74,143,168,0.12)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
        }}
      >
        ✨
      </div>
    )
  }

  if (avatarUrl) {
    return <img src={avatarUrl} alt={alias} style={{ width: 48, height: 48, borderRadius: 999, objectFit: 'cover' }} />
  }

  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 999,
        background: 'rgba(122,138,148,0.12)',
        display: 'grid',
        placeItems: 'center',
        color: C.deep,
        fontFamily: cn,
      }}
    >
      {alias.slice(0, 1)}
    </div>
  )
}

function CorrespondenceCard({ corr }: { corr: CorrespondenceCardData }) {
  const isAI = corr.is_ai_fallback
  const days = Math.floor((Date.now() - new Date(corr.created_at).getTime()) / 86400000)

  return (
    <Link
      href={`/letters/${corr.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr auto',
        gap: 14,
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid rgba(122,138,148,0.16)',
        background: corr.unread ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.56)',
        padding: '14px 14px 14px 12px',
      }}
    >
      <Avatar alias={corr.partner.alias} avatarUrl={corr.partner.avatar_url} isAI={isAI} />

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
          <div style={{ fontFamily: cn, fontWeight: 700, color: C.deep }}>
            {isAI ? 'AI伴侣 · 等待中' : corr.partner.alias}
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.stone, whiteSpace: 'nowrap' }}>
            {corr.last_letter_at ? relativeDate(corr.last_letter_at) : '刚刚'}
          </div>
        </div>

        <div
          style={{
            marginTop: 7,
            fontFamily: serif,
            fontStyle: 'italic',
            color: C.stone,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {corr.last_letter_preview || '…'}
        </div>

        <div style={{ marginTop: 9, fontFamily: mono, fontSize: 10, color: C.stone, letterSpacing: '0.08em' }}>
          {corr.letter_count} 封信
          {days > 0 ? ` · ${days} 天` : ''}
          {corr.unread ? ' · 新回信' : ''}
        </div>
      </div>

      {corr.unread ? (
        <div
          aria-label="Unread"
          style={{ width: 10, height: 10, borderRadius: 999, background: C.tide, flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 10, height: 10 }} />
      )}
    </Link>
  )
}

function EmptyShore() {
  return (
    <div
      style={{
        border: '1px solid rgba(122,138,148,0.14)',
        background: 'rgba(255,255,255,0.42)',
        padding: '36px 18px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontFamily: cn, fontSize: 22, color: C.deep }}>海岸今晚很安静。</p>
      <p style={{ margin: '8px 0 20px', fontFamily: serif, fontStyle: 'italic', color: C.stone }}>
        The shore is quiet tonight.
      </p>
      <Link
        href="/write"
        style={{
          display: 'inline-block',
          textDecoration: 'none',
          background: C.tide,
          color: 'white',
          padding: '12px 18px',
          fontFamily: cn,
        }}
      >
        写一封信
      </Link>
    </div>
  )
}

export default function ShorePage() {
  const router = useRouter()
  const [correspondences, setCorrespondences] = useState<CorrespondenceCardData[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      const { data: profile } = await supabase.from('profiles').select('id').eq('auth_id', user.id).single()
      if (!profile) {
        router.push('/onboard')
        return
      }

      setCurrentUserId(profile.id)

      const { data: corrData } = await supabase
        .from('correspondences')
        .select(
          'id, user_a_id, user_b_id, is_ai_fallback, letter_count, last_letter_at, created_at, status, last_read_by_a_at, last_read_by_b_at'
        )
        .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
        .eq('status', 'active')
        .order('last_letter_at', { ascending: false, nullsFirst: false })

      if (!corrData) {
        setLoading(false)
        return
      }

      const enriched = await Promise.all(
        (corrData as CorrespondenceRow[]).map(async (corr) => {
          const partnerId = corr.user_a_id === profile.id ? corr.user_b_id : corr.user_a_id
          const readAt = corr.user_a_id === profile.id ? corr.last_read_by_a_at : corr.last_read_by_b_at

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

          const unread = Boolean(corr.last_letter_at && (!readAt || new Date(corr.last_letter_at) > new Date(readAt)))

          return {
            ...corr,
            partner: partnerProfile ?? { id: partnerId, alias: '神秘漂流者', avatar_url: null },
            last_letter_preview: preview,
            unread,
          }
        })
      )

      setCorrespondences(enriched)
      setLoading(false)
    }

    void load()
  }, [router])

  const unreadCount = useMemo(() => correspondences.filter((item) => item.unread).length, [correspondences])

  return (
    <div style={{ minHeight: '100vh', background: C.sand, padding: '28px 20px 100px' }}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', color: C.stone }}>SHORE</p>
            <h1 style={{ margin: '8px 0 2px', fontFamily: cn, fontSize: 32, color: C.deep }}>岸边</h1>
            <p style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', color: C.stone }}>The Shore</p>
          </div>
          <Link href="/write" style={{ textDecoration: 'none', color: C.tide, fontFamily: cn }}>
            ✏️ 写信
          </Link>
        </div>

        {currentUserId && unreadCount > 0 && (
          <div style={{ border: '1px solid rgba(74,143,168,0.18)', background: 'rgba(74,143,168,0.08)', padding: '12px 14px' }}>
            <span style={{ fontFamily: cn, color: C.deep }}>{`你收到 ${unreadCount} 封新回信`}</span>
          </div>
        )}

        <WednesdayBanner />

        {loading ? (
          <div style={{ padding: '36px 0', textAlign: 'center', fontFamily: cn, color: C.stone }}>潮水正在涌来…</div>
        ) : correspondences.length === 0 ? (
          <EmptyShore />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {correspondences.map((corr) => (
              <CorrespondenceCard key={corr.id} corr={corr} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
