'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'

type Letter = {
  id:              string
  sender_id:       string
  content:         string
  is_ai_generated: boolean
  created_at:      string
}

type CorrespondenceDetails = {
  id:            string
  user_a_id:     string
  user_b_id:     string
  is_ai_fallback: boolean
  letter_count:  number
  sync_enabled:  boolean
  created_at:    string
  partner: {
    id:         string
    alias:      string
    avatar_url: string | null
  }
}

// Crisis detection keywords
const CRISIS_ZH = ['自杀', '不想活', '活不下去', '结束生命', '自残']

function CrisisBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 mb-3 p-4 bg-red-50 border border-red-200"
    >
      <p className="font-cn font-bold text-red-700 text-sm mb-1">需要帮助吗？</p>
      <p className="font-cn text-red-600 text-xs leading-relaxed mb-2">
        如果你正在经历困难，请联系专业帮助。
      </p>
      <p className="font-mono text-[9px] text-red-500 tracking-wider mb-1">
        北京心理援助：010-82951332
      </p>
      <p className="font-mono text-[9px] text-red-500 tracking-wider mb-3">
        全国心理援助热线：400-161-9995
      </p>
      <button
        onClick={onDismiss}
        className="font-mono text-[9px] text-red-400 tracking-widest uppercase
                   hover:text-red-600 transition-colors"
      >
        关闭
      </button>
    </motion.div>
  )
}

function AnniversaryBadge({ days }: { days: number }) {
  if (days !== 30 && days !== 60 && days !== 90) return null

  const messages: Record<number, string> = {
    30: '你们已经通信30天了 🎉',
    60: '60天的信缘 ✨',
    90: '90天，三个月的相知 💛',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 mb-4 p-3 bg-gold-shore/10 border border-gold-shore/30
                 text-center"
    >
      <p className="font-cn text-gold-shore text-sm font-bold">
        {messages[days]}
      </p>
    </motion.div>
  )
}

function LetterBubble({
  letter,
  isMine,
  isAI,
}: {
  letter: Letter
  isMine: boolean
  isAI:   boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-5`}
    >
      <div className={`max-w-[85%] ${isMine ? 'items-end' : 'items-start'}
                       flex flex-col gap-1`}>
        {isAI && !isMine && (
          <span className="font-mono text-[8px] tracking-wider text-stone-shore/50
                           uppercase ml-1">
            AI · 保温中
          </span>
        )}
        <div className={isMine ? 'bubble-sent' : 'bubble-received'}>
          <p className="text-letter text-sm text-deep-700 leading-[1.8]
                        whitespace-pre-wrap">
            {letter.content}
          </p>
        </div>
        <span className={`font-mono text-[8px] tracking-wider text-stone-shore/40
          ${isMine ? 'mr-1' : 'ml-1'}`}>
          {formatDistanceToNow(new Date(letter.created_at), {
            locale: zhCN,
            addSuffix: true,
          })}
        </span>
      </div>
    </motion.div>
  )
}

export default function LettersPage() {
  const params = useParams()
  const router = useRouter()
  const corrId = params.id as string

  const [corr, setCorr]               = useState<CorrespondenceDetails | null>(null)
  const [letters, setLetters]         = useState<Letter[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const [reply, setReply]             = useState('')
  const [sending, setSending]         = useState(false)
  const [showCrisis, setShowCrisis]   = useState(false)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  const dayCount = corr
    ? Math.floor((Date.now() - new Date(corr.created_at).getTime()) / 86400000)
    : 0

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [letters, scrollToBottom])

  // Load correspondence + letters
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

      if (!profile) return
      setCurrentProfileId(profile.id)

      // Load correspondence
      const { data: corrData } = await supabase
        .from('correspondences')
        .select('id, user_a_id, user_b_id, is_ai_fallback, letter_count, sync_enabled, created_at')
        .eq('id', corrId)
        .single()

      if (!corrData) { router.push('/shore'); return }

      // Verify user is a participant
      if (corrData.user_a_id !== profile.id && corrData.user_b_id !== profile.id) {
        router.push('/shore')
        return
      }

      // Load partner profile
      const partnerId = corrData.user_a_id === profile.id
        ? corrData.user_b_id
        : corrData.user_a_id

      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('id, alias, avatar_url')
        .eq('id', partnerId)
        .single()

      setCorr({
        ...corrData,
        partner: partnerProfile ?? { id: partnerId, alias: '神秘漂流者', avatar_url: null },
      })

      // Load letters
      const { data: letterData } = await supabase
        .from('letters')
        .select('id, sender_id, content, is_ai_generated, created_at')
        .eq('correspondence_id', corrId)
        .order('created_at', { ascending: true })

      setLetters(letterData ?? [])
      setLoading(false)

      // Subscribe to new letters
      const channel = supabase
        .channel(`letters:${corrId}`)
        .on(
          'postgres_changes',
          {
            event:  'INSERT',
            schema: 'public',
            table:  'letters',
            filter: `correspondence_id=eq.${corrId}`,
          },
          (payload) => {
            setLetters(prev => [...prev, payload.new as Letter])
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    load()
  }, [corrId, router])

  async function handleSend() {
    if (!reply.trim() || sending || !currentProfileId) return

    // Check for crisis keywords
    const hasCrisis = CRISIS_ZH.some(kw => reply.includes(kw))
    if (hasCrisis) setShowCrisis(true)

    setSending(true)
    setError(null)

    try {
      // Safety scan
      const safetyRes = await fetch('/api/safety/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: reply }),
      })
      const safety = await safetyRes.json()

      if (safety.score < 0.4) {
        setError('这封信包含不适合的内容，无法发送。')
        setSending(false)
        return
      }

      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('letters')
        .insert({
          correspondence_id: corrId,
          sender_id:         currentProfileId,
          content:           reply.trim(),
          safety_score:      safety.score,
        })

      if (insertError) throw insertError

      setReply('')
      textRef.current?.focus()
    } catch (err: any) {
      setError(err.message || '发送失败，请重试。')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-sand-100 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="font-cn text-stone-shore text-sm"
        >
          信漂来了…
        </motion.div>
      </div>
    )
  }

  if (!corr) return null

  return (
    <div className="min-h-dvh bg-sand-100 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-sand-100/90 backdrop-blur-sm
                         border-b border-stone-shore/10 px-4 py-3
                         flex items-center gap-3">
        <Link
          href="/shore"
          className="font-mono text-[10px] text-stone-shore tracking-wider
                     hover:text-tide transition-colors"
        >
          ← 岸边
        </Link>

        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 flex-shrink-0 overflow-hidden border
                          border-stone-shore/20 bg-sand-200
                          flex items-center justify-center text-sm">
            {corr.is_ai_fallback ? '🤖' :
              corr.partner.avatar_url
                ? <img src={corr.partner.avatar_url} alt=""
                       className="w-full h-full object-cover" />
                : '🌊'
            }
          </div>
          <div>
            <p className="font-cn font-bold text-deep-700 text-sm">
              {corr.is_ai_fallback ? 'AI伴侣' : corr.partner.alias}
            </p>
            <p className="font-mono text-[8px] text-stone-shore/60 tracking-wider">
              通信 {dayCount} 天 · {corr.letter_count} 封信
            </p>
          </div>
        </div>

        {/* Report button */}
        <button className="font-mono text-[9px] text-stone-shore/40
                           tracking-wider uppercase hover:text-rose-400
                           transition-colors">
          举报
        </button>
      </header>

      {/* Letters */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Anniversary */}
        <AnniversaryBadge days={dayCount} />

        {/* Crisis banner */}
        <AnimatePresence>
          {showCrisis && (
            <CrisisBanner onDismiss={() => setShowCrisis(false)} />
          )}
        </AnimatePresence>

        {/* Sync unlocked notice */}
        <AnimatePresence>
          {corr.sync_enabled && corr.letter_count === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-4"
            >
              <span className="font-mono text-[9px] text-tide tracking-widest uppercase
                               border border-tide/30 px-3 py-1">
                实时对话已解锁
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Letter thread */}
        {letters.map((letter) => (
          <LetterBubble
            key={letter.id}
            letter={letter}
            isMine={letter.sender_id === currentProfileId}
            isAI={letter.is_ai_generated}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Reply area */}
      <div className="sticky bottom-0 border-t border-stone-shore/10
                      bg-sand-100/95 backdrop-blur-sm px-4 py-3">

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[9px] text-red-400 tracking-wider mb-2"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          <textarea
            ref={textRef}
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="写回信…"
            rows={2}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.metaKey) handleSend()
            }}
            className="flex-1 bg-transparent resize-none font-serif italic
                       text-sm text-deep-700 placeholder:text-stone-shore/30
                       focus:outline-none leading-relaxed
                       border-b border-stone-shore/20 pb-1
                       focus:border-tide transition-colors"
          />
          <motion.button
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            whileTap={{ scale: 0.95 }}
            className={`w-10 h-10 flex items-center justify-center flex-shrink-0
              transition-colors duration-200
              ${reply.trim() && !sending
                ? 'bg-tide text-white hover:bg-tide-dark'
                : 'bg-stone-shore/10 text-stone-shore/30'
              }`}
          >
            {sending ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="text-xs"
              >
                ⟳
              </motion.span>
            ) : '↗'}
          </motion.button>
        </div>

        <p className="font-mono text-[8px] text-stone-shore/30 tracking-wider
                      text-right mt-1">
          ⌘↵ 发送
        </p>
      </div>
    </div>
  )
}
