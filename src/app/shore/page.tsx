'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow, isWednesday, setHours, isAfter } from 'date-fns'
import { zhCN } from 'date-fns/locale'

type Correspondence = {
  id:              string
  user_a_id:       string
  user_b_id:       string
  is_ai_fallback:  boolean
  letter_count:    number
  last_letter_at:  string | null
  created_at:      string
  status:          string
  // Joined
  partner: {
    id:         string
    alias:      string
    avatar_url: string | null
  }
  last_letter_preview?: string
}

function WednesdayBanner() {
  const now       = new Date()
  const tideTime  = setHours(new Date(), 20) // 8pm
  const isTideDay = isWednesday(now)
  const isPast    = isAfter(now, tideTime)

  if (!isTideDay) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-4 border border-tide/30
                 bg-gradient-to-r from-tide/5 to-water-200/20"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌊</span>
        <div>
          <p className="font-cn font-bold text-deep-700 text-sm">
            星期三潮汐
          </p>
          <p className="font-mono text-[9px] text-tide tracking-wider uppercase mt-0.5">
            {isPast
              ? '今晚的信已漂出，等待配对中…'
              : `今晚8点，新的信漂来`
            }
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function CorrespondenceCard({
  corr,
  currentUserId,
}: {
  corr: Correspondence
  currentUserId: string
}) {
  const isAI        = corr.is_ai_fallback
  const isNew       = corr.letter_count <= 1
  const dayCount    = Math.floor(
    (Date.now() - new Date(corr.created_at).getTime()) / 86400000
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/letters/${corr.id}`}
        className={`flex items-start gap-4 px-4 py-4 border-b
          transition-colors duration-200 hover:bg-sand-200/50
          ${isNew ? 'border-b-tide/20' : 'border-b-stone-shore/10'}`}
      >
        {/* Avatar */}
        <div
          className={`w-11 h-11 flex-shrink-0 flex items-center justify-center
            text-lg overflow-hidden border
            ${isAI
              ? 'border-water-300/40 bg-water-100'
              : isNew
                ? 'border-tide/30 bg-tide/5'
                : 'border-stone-shore/20 bg-sand-200'
            }`}
        >
          {isAI ? (
            <span>🤖</span>
          ) : corr.partner.avatar_url ? (
            <img
              src={corr.partner.avatar_url}
              alt={corr.partner.alias}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>🌊</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <p className={`font-cn font-bold text-sm truncate
              ${isAI ? 'text-stone-shore italic' : 'text-deep-700'}`}>
              {isAI ? 'AI伴侣 · 等待配对' : corr.partner.alias}
            </p>
            <span className="font-mono text-[9px] text-stone-shore/60
                             tracking-wider flex-shrink-0 ml-2">
              {corr.last_letter_at
                ? formatDistanceToNow(
                    new Date(corr.last_letter_at),
                    { locale: zhCN, addSuffix: false }
                  ) + '前'
                : '刚刚'
              }
            </span>
          </div>

          <p className="font-serif italic text-xs text-stone-shore/70
                        truncate leading-relaxed">
            {corr.last_letter_preview || '…'}
          </p>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="font-mono text-[9px] text-stone-shore/50
                             tracking-wider">
              {corr.letter_count} 封信
            </span>
            {dayCount > 0 && (
              <span className="font-mono text-[9px] text-stone-shore/40
                               tracking-wider">
                · {dayCount} 天
              </span>
            )}
            {isNew && (
              <span className="font-mono text-[9px] tracking-wider
                               text-tide uppercase">
                · 新信
              </span>
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {isNew && (
          <div className="w-2 h-2 rounded-full bg-tide flex-shrink-0 mt-1.5" />
        )}
      </Link>
    </motion.div>
  )
}

function EmptyShore() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      {/* Animated bottle */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl mb-6"
      >
        🍶
      </motion.div>
      <p className="font-cn text-deep-700/50 text-base mb-1">
        海岸今晚很安静。
      </p>
      <p className="font-serif italic text-stone-shore/60 text-sm mb-8">
        The shore is quiet tonight.
      </p>
      <Link href="/write" className="btn-tide font-cn tracking-widest px-8">
        写第一封信
      </Link>
    </motion.div>
  )
}

export default function ShorePage() {
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([])
  const [currentUserId, setCurrentUserId]     = useState<string | null>(null)
  const [loading, setLoading]                 = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!profile) return
      setCurrentUserId(profile.id)

      // Get active correspondences with partner info
      const { data: corrData } = await supabase
        .from('correspondences')
        .select(`
          id, user_a_id, user_b_id, is_ai_fallback,
          letter_count, last_letter_at, created_at, status
        `)
        .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
        .eq('status', 'active')
        .order('last_letter_at', { ascending: false, nullsFirst: false })

      if (!corrData) { setLoading(false); return }

      // Fetch partner profiles and last letter preview
      const enriched: Correspondence[] = await Promise.all(
        corrData.map(async (corr) => {
          const partnerId = corr.user_a_id === profile.id
            ? corr.user_b_id
            : corr.user_a_id

          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('id, alias, avatar_url')
            .eq('id', partnerId)
            .single()

          // Get last letter preview
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
            partner: partnerProfile ?? {
              id: partnerId,
              alias: '神秘漂流者',
              avatar_url: null,
            },
            last_letter_preview: preview,
          }
        })
      )

      setCorrespondences(enriched)
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="min-h-dvh bg-sand-100 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-sand-100/90 backdrop-blur-sm
                         border-b border-stone-shore/10 px-4 py-4
                         flex items-center justify-between">
        <div>
          <h1 className="font-cn font-black text-xl text-deep-700">岸边</h1>
          <p className="font-mono text-[9px] text-stone-shore tracking-widest uppercase">
            The Shore
          </p>
        </div>
        <Link
          href="/write"
          className="w-10 h-10 bg-tide flex items-center justify-center
                     text-white text-xl hover:bg-tide-dark transition-colors"
        >
          ✏️
        </Link>
      </header>

      {/* Wednesday Banner */}
      <div className="pt-4">
        <WednesdayBanner />
      </div>

      {/* Correspondences */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-cn text-stone-shore text-sm"
          >
            潮水正在涌来…
          </motion.div>
        </div>
      ) : correspondences.length === 0 ? (
        <EmptyShore />
      ) : (
        <div className="flex-1">
          <AnimatePresence>
            {correspondences.map((corr, i) => (
              <motion.div
                key={corr.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CorrespondenceCard
                  corr={corr}
                  currentUserId={currentUserId ?? ''}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="sticky bottom-0 border-t border-stone-shore/10
                      bg-sand-100/95 backdrop-blur-sm
                      grid grid-cols-3 py-2">
        {[
          { href: '/shore',   label: '岸边', en: 'Shore',  active: true  },
          { href: '/write',   label: '写信', en: 'Write',  active: false },
          { href: '/profile', label: '我的', en: 'Profile',active: false },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1.5
              ${item.active ? 'text-tide' : 'text-stone-shore'}`}
          >
            <span className="font-cn text-xs font-bold">{item.label}</span>
            <span className="font-mono text-[8px] tracking-wider uppercase opacity-60">
              {item.en}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
