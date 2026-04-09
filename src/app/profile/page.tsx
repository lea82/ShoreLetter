'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const C = {
  sand:  '#f5f0e8',
  sand2: '#ede6d6',
  tide:  '#4a8fa8',
  deep:  '#1a2e3b',
  stone: '#7a8a94',
}

const serif = 'var(--font-baskerville), Georgia, serif'
const cn    = 'var(--font-noto-serif-sc), serif'
const mono  = 'var(--font-dm-mono), monospace'

type Letter = {
  id:              string
  sender_id:       string
  content:         string
  is_ai_generated: boolean
  created_at:      string
}

type CorrDetails = {
  id:             string
  user_a_id:      string
  user_b_id:      string
  is_ai_fallback: boolean
  letter_count:   number
  sync_enabled:   boolean
  created_at:     string
  partner: { id: string; alias: string; avatar_url: string | null }
}

const CRISIS_ZH = ['自杀', '不想活', '活不下去', '结束生命', '自残']

function relDate(date: string): string {
  const d = Date.now() - new Date(date).getTime()
  const m = Math.floor(d / 60000)
  const h = Math.floor(d / 3600000)
  const day = Math.floor(d / 86400000)
  if (m < 1)   return '刚刚'
  if (m < 60)  return `${m}分钟前`
  if (h < 24)  return `${h}小时前`
  if (day < 7) return `${day}天前`
  return new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function CrisisBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        margin: '0 0 12px', padding: 16,
        background: 'rgba(229,115,115,0.05)',
        border: '1px solid rgba(229,115,115,0.25)',
      }}
    >
      <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 13,
                  color: '#c62828', margin: '0 0 6px' }}>需要帮助吗？</p>
      <p style={{ fontFamily: cn, fontSize: 12, color: '#c62828',
                  lineHeight: 1.7, margin: '0 0 8px' }}>
        如果你正在经历困难，请联系专业帮助。
      </p>
      <p style={{ fontFamily: mono, fontSize: 9, color: '#e57373',
                  letterSpacing: '0.08em', margin: '0 0 3px' }}>
        北京心理援助：010-82951332
      </p>
      <p style={{ fontFamily: mono, fontSize: 9, color: '#e57373',
                  letterSpacing: '0.08em', margin: '0 0 12px' }}>
        全国心理援助热线：400-161-9995
      </p>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#e57373',
      }}>关闭</button>
    </motion.div>
  )
}

function AnniversaryBadge({ days }: { days: number }) {
  const msgs: Record<number, string> = {
    30: '你们已经通信30天了 🎉',
    60: '60天的信缘 ✨',
    90: '90天，三个月的相知 💛',
  }
  if (!msgs[days]) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      style={{
        margin: '0 0 16px', padding: '10px 16px', textAlign: 'center',
        background: 'rgba(184,148,63,0.08)',
        border: '1px solid rgba(184,148,63,0.25)',
      }}
    >
      <p style={{ fontFamily: cn, fontSize: 13, color: '#b8943f', margin: 0 }}>
        {msgs[days]}
      </p>
    </motion.div>
  )
}

function LetterBubble({ letter, isMine, isAI }: {
  letter: Letter; isMine: boolean; isAI: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        marginBottom: 20,
      }}
    >
      <div style={{
        maxWidth: '85%', display: 'flex', flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start', gap: 4,
      }}>
        {isAI && !isMine && (
          <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.1em',
                         textTransform: 'uppercase', color: C.stone + '80',
                         marginLeft: 4 }}>
            AI · 保温中
          </span>
        )}
        <div style={{
          padding: '12px 16px',
          background: isMine ? 'rgba(200,221,232,0.4)' : 'rgba(237,230,214,0.85)',
          border: `1px solid ${isMine ? 'rgba(155,191,212,0.4)' : 'rgba(180,165,140,0.25)'}`,
          borderRadius: isMine ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
          marginLeft: isMine ? 20 : 0,
          marginRight: isMine ? 0 : 20,
        }}>
          <p style={{
            fontFamily: serif, fontStyle: 'italic', fontSize: 14,
            color: C.deep, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {letter.content}
          </p>
        </div>
        <span style={{
          fontFamily: mono, fontSize: 8, letterSpacing: '0.08em',
          color: C.stone + '70',
          marginLeft: isMine ? 0 : 4,
          marginRight: isMine ? 4 : 0,
        }}>
          {relDate(letter.created_at)}
        </span>
      </div>
    </motion.div>
  )
}

export default function LettersPage() {
  const params  = useParams()
  const router  = useRouter()
  const corrId  = params.id as string

  const [corr, setCorr]                         = useState<CorrDetails | null>(null)
  const [letters, setLetters]                   = useState<Letter[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const [reply, setReply]                       = useState('')
  const [sending, setSending]                   = useState(false)
  const [showCrisis, setShowCrisis]             = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  const dayCount = corr
    ? Math.floor((Date.now() - new Date(corr.created_at).getTime()) / 86400000)
    : 0

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [letters, scrollToBottom])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles').select('id').eq('auth_id', user.id).single()
      if (!profile) return
      setCurrentProfileId(profile.id)

      const { data: corrData } = await supabase
        .from('correspondences')
        .select('id, user_a_id, user_b_id, is_ai_fallback, letter_count, sync_enabled, created_at')
        .eq('id', corrId).single()

      if (!corrData) { router.push('/shore'); return }

      if (corrData.user_a_id !== profile.id && corrData.user_b_id !== profile.id) {
        router.push('/shore'); return
      }

      const partnerId = corrData.user_a_id === profile.id
        ? corrData.user_b_id : corrData.user_a_id

      const { data: partner } = await supabase
        .from('profiles').select('id, alias, avatar_url').eq('id', partnerId).single()

      setCorr({
        ...corrData,
        partner: partner ?? { id: partnerId, alias: '神秘漂流者', avatar_url: null },
      })

      const { data: letterData } = await supabase
        .from('letters')
        .select('id, sender_id, content, is_ai_generated, created_at')
        .eq('correspondence_id', corrId)
        .order('created_at', { ascending: true })

      setLetters(letterData ?? [])
      setLoading(false)

      const channel = supabase
        .channel(`letters:${corrId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'letters',
          filter: `correspondence_id=eq.${corrId}`,
        }, (payload) => {
          setLetters(prev => [...prev, payload.new as Letter])
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [corrId, router])

  async function handleSend() {
    if (!reply.trim() || sending || !currentProfileId) return

    if (CRISIS_ZH.some(kw => reply.includes(kw))) setShowCrisis(true)

    setSending(true)
    setError(null)

    try {
      const safetyRes = await fetch('/api/safety/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
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
      <div style={{ minHeight: '100dvh', background: C.sand,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontFamily: cn, color: C.stone, fontSize: 14 }}
        >
          信漂来了…
        </motion.p>
      </div>
    )
  }

  if (!corr) return null

  return (
    <div style={{ minHeight: '100dvh', background: C.sand,
                  display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(245,240,232,0.93)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link href="/shore" style={{
          fontFamily: mono, fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: C.stone,
          textDecoration: 'none', flexShrink: 0,
        }}>
          ← 岸边
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0,
            border: '1px solid rgba(122,138,148,0.2)',
            background: C.sand2, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>
            {corr.is_ai_fallback ? '🤖'
              : corr.partner.avatar_url
                ? <img src={corr.partner.avatar_url} alt=""
                       style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🌊'
            }
          </div>
          <div>
            <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 14,
                        color: C.deep, margin: '0 0 1px' }}>
              {corr.is_ai_fallback ? 'AI伴侣' : corr.partner.alias}
            </p>
            <p style={{ fontFamily: mono, fontSize: 8, color: C.stone + '80',
                        letterSpacing: '0.08em', margin: 0 }}>
              通信 {dayCount} 天 · {corr.letter_count} 封信
            </p>
          </div>
        </div>

        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: mono, fontSize: 9, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: C.stone + '60',
        }}>
          举报
        </button>
      </header>

      {/* Letters scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>

        <AnniversaryBadge days={dayCount} />

        <AnimatePresence>
          {showCrisis && <CrisisBanner onDismiss={() => setShowCrisis(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {corr.sync_enabled && corr.letter_count === 3 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', marginBottom: 16 }}
            >
              <span style={{
                fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: C.tide,
                border: '1px solid rgba(74,143,168,0.3)',
                padding: '4px 12px',
              }}>
                实时对话已解锁
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {letters.map(letter => (
          <LetterBubble
            key={letter.id}
            letter={letter}
            isMine={letter.sender_id === currentProfileId}
            isAI={letter.is_ai_generated}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      <div style={{
        position: 'sticky', bottom: 0,
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(245,240,232,0.97)',
        backdropFilter: 'blur(8px)',
        padding: '12px 16px',
      }}>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontFamily: mono, fontSize: 9, color: '#e57373',
                       letterSpacing: '0.08em', margin: '0 0 8px' }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <textarea
            ref={textRef}
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="写回信…"
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSend() }}
            style={{
              flex: 1, background: 'transparent', resize: 'none',
              fontFamily: serif, fontStyle: 'italic', fontSize: 14,
              color: C.deep, lineHeight: 1.7,
              border: 'none', borderBottom: '1px solid rgba(122,138,148,0.2)',
              paddingBottom: 4, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 40, height: 40, flexShrink: 0,
              background: reply.trim() && !sending ? C.tide : 'rgba(122,138,148,0.15)',
              color: reply.trim() && !sending ? 'white' : C.stone + '60',
              border: 'none', cursor: reply.trim() && !sending ? 'pointer' : 'not-allowed',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            {sending ? '…' : '↗'}
          </motion.button>
        </div>

        <p style={{ fontFamily: mono, fontSize: 8, color: C.stone + '50',
                    textAlign: 'right', margin: '4px 0 0',
                    letterSpacing: '0.08em' }}>
          ⌘↵ 发送
        </p>
      </div>
    </div>
  )
}
