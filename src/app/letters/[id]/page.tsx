'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Letter = {
  id: string
  sender_id: string
  content: string
  is_ai_generated: boolean
  created_at: string
}

type CorrDetails = {
  id: string
  user_a_id: string
  user_b_id: string
  is_ai_fallback: boolean
  letter_count: number
  sync_enabled: boolean
  created_at: string
  partner: {
    id: string
    alias: string
    avatar_url: string | null
  }
}

const C = {
  sand: '#f5f0e8',
  sand2: '#ede6d6',
  tide: '#4a8fa8',
  deep: '#1a2e3b',
  stone: '#7a8a94',
}

const serif = 'var(--font-baskerville), Georgia, serif'
const cn = 'var(--font-noto-serif-sc), serif'
const mono = 'var(--font-dm-mono), monospace'
const CRISIS_ZH = ['自杀', '不想活', '活不下去', '结束生命', '自残']

function relDate(date: string): string {
  const d = Date.now() - new Date(date).getTime()
  const m = Math.floor(d / 60000)
  const h = Math.floor(d / 3600000)
  const day = Math.floor(d / 86400000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  if (h < 24) return `${h}小时前`
  if (day < 7) return `${day}天前`
  return new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function CrisisBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{ border: '1px solid rgba(209,91,91,0.25)', background: 'rgba(255,240,240,0.92)', padding: '14px 16px' }}>
      <div style={{ fontFamily: cn, fontWeight: 700, color: '#9f4040', marginBottom: 8 }}>需要帮助吗？</div>
      <div style={{ fontFamily: cn, color: C.deep, lineHeight: 1.7 }}>如果你正在经历困难，请联系专业帮助。</div>
      <div style={{ marginTop: 10, fontFamily: mono, fontSize: 11, color: C.stone }}>北京心理援助：010-82951332</div>
      <div style={{ fontFamily: mono, fontSize: 11, color: C.stone }}>全国心理援助热线：400-161-9995</div>
      <button onClick={onDismiss} style={{ marginTop: 12, border: 'none', background: 'transparent', color: C.tide, cursor: 'pointer', fontFamily: mono }}>
        关闭
      </button>
    </div>
  )
}

function AnniversaryBadge({ days }: { days: number }) {
  const msgs: Record<number, string> = {
    30: '你们已经通信 30 天了 ✨',
    60: '60 天的信缘 ✨',
    90: '90 天，三个月的相知 ✨',
  }

  if (!msgs[days]) return null

  return (
    <div style={{ border: '1px solid rgba(184,148,63,0.25)', background: 'rgba(184,148,63,0.08)', padding: '10px 12px', fontFamily: cn, color: C.deep }}>
      {msgs[days]}
    </div>
  )
}

function LetterBubble({ letter, isMine, isAI }: { letter: Letter; isMine: boolean; isAI: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '82%',
          border: '1px solid rgba(122,138,148,0.14)',
          background: isMine ? 'rgba(74,143,168,0.08)' : 'rgba(255,255,255,0.62)',
          padding: '14px 14px 12px',
        }}
      >
        {isAI && !isMine && (
          <div style={{ marginBottom: 8, fontFamily: mono, fontSize: 10, color: C.stone, letterSpacing: '0.1em' }}>AI · 保温中</div>
        )}
        <div style={{ fontFamily: serif, fontStyle: 'italic', color: C.deep, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{letter.content}</div>
        <div style={{ marginTop: 8, fontFamily: mono, fontSize: 10, color: C.stone }}>{relDate(letter.created_at)}</div>
      </div>
    </div>
  )
}

export default function LettersPage() {
  const params = useParams()
  const router = useRouter()
  const corrId = params.id as string

  const [corr, setCorr] = useState<CorrDetails | null>(null)
  const [letters, setLetters] = useState<Letter[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [showCrisis, setShowCrisis] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLTextAreaElement | null>(null)

  const dayCount = useMemo(() => (corr ? Math.floor((Date.now() - new Date(corr.created_at).getTime()) / 86400000) : 0), [corr])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const markThreadRead = useCallback(
    async (profileId: string) => {
      const supabase = createClient()
      await supabase.rpc('mark_correspondence_read', { corr_id: corrId, reader_profile_id: profileId })
    },
    [corrId]
  )

  useEffect(() => {
    scrollToBottom()
  }, [letters, scrollToBottom])

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

      setCurrentProfileId(profile.id)

      const { data: corrData } = await supabase
        .from('correspondences')
        .select('id, user_a_id, user_b_id, is_ai_fallback, letter_count, sync_enabled, created_at')
        .eq('id', corrId)
        .single()

      if (!corrData) {
        router.push('/shore')
        return
      }

      if (corrData.user_a_id !== profile.id && corrData.user_b_id !== profile.id) {
        router.push('/shore')
        return
      }

      const partnerId = corrData.user_a_id === profile.id ? corrData.user_b_id : corrData.user_a_id
      const { data: partner } = await supabase.from('profiles').select('id, alias, avatar_url').eq('id', partnerId).single()

      setCorr({
        ...(corrData as Omit<CorrDetails, 'partner'>),
        partner: partner ?? { id: partnerId, alias: '神秘漂流者', avatar_url: null },
      })

      const { data: letterData } = await supabase
        .from('letters')
        .select('id, sender_id, content, is_ai_generated, created_at')
        .eq('correspondence_id', corrId)
        .order('created_at', { ascending: true })

      setLetters((letterData ?? []) as Letter[])
      setLoading(false)
      await markThreadRead(profile.id)

      const channel = supabase
        .channel(`letters:${corrId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'letters',
            filter: `correspondence_id=eq.${corrId}`,
          },
          (payload) => {
            const incoming = payload.new as Letter
            setLetters((prev) => {
              if (prev.some((item) => item.id === incoming.id)) return prev
              return [...prev, incoming]
            })

            if (profile.id && incoming.sender_id !== profile.id) {
              void markThreadRead(profile.id)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    void load()
  }, [corrId, markThreadRead, router])

  async function handleSend() {
    if (!reply.trim() || sending || !currentProfileId) return

    if (CRISIS_ZH.some((kw) => reply.includes(kw))) {
      setShowCrisis(true)
    }

    setSending(true)
    setError(null)

    try {
      const safetyRes = await fetch('/api/safety/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      })
      const safety = await safetyRes.json()

      if (!safetyRes.ok || typeof safety?.score !== 'number') {
        throw new Error('内容检查失败，请重试。')
      }

      if (safety.score < 0.4) {
        setError('这封信包含不适合的内容，无法发送。')
        setSending(false)
        return
      }

      const supabase = createClient()
      const { error: insertError } = await supabase.from('letters').insert({
        correspondence_id: corrId,
        sender_id: currentProfileId,
        content: reply.trim(),
        safety_score: safety.score,
      })

      if (insertError) throw insertError

      await markThreadRead(currentProfileId)
      setReply('')
      textRef.current?.focus()
    } catch (err) {
      const message = err instanceof Error ? err.message : '发送失败，请重试。'
      setError(message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.sand, display: 'grid', placeItems: 'center', fontFamily: cn, color: C.stone }}>
        信漂来了…
      </div>
    )
  }

  if (!corr) return null

  return (
    <div style={{ minHeight: '100vh', background: C.sand, padding: '24px 18px 28px' }}>
      <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div>
            <Link href="/shore" style={{ textDecoration: 'none', color: C.tide, fontFamily: cn }}>
              ← 岸边
            </Link>
            <div style={{ marginTop: 10, fontFamily: cn, fontSize: 28, color: C.deep }}>
              {corr.is_ai_fallback ? 'AI伴侣' : corr.partner.alias}
            </div>
            <div style={{ marginTop: 4, fontFamily: mono, fontSize: 10, color: C.stone, letterSpacing: '0.08em' }}>
              通信 {dayCount} 天 · {corr.letter_count} 封信
            </div>
          </div>

          <button style={{ border: 'none', background: 'transparent', color: C.stone, fontFamily: mono, cursor: 'pointer' }}>举报</button>
        </div>

        <AnniversaryBadge days={dayCount} />
        {showCrisis && <CrisisBanner onDismiss={() => setShowCrisis(false)} />}
        {corr.sync_enabled && corr.letter_count >= 3 && (
          <div style={{ border: '1px solid rgba(74,143,168,0.18)', background: 'rgba(74,143,168,0.08)', padding: '10px 12px', fontFamily: cn, color: C.deep }}>
            实时对话已解锁
          </div>
        )}

        <div style={{ display: 'grid', gap: 12, minHeight: '48vh' }}>
          {letters.map((letter) => (
            <LetterBubble
              key={letter.id}
              letter={letter}
              isMine={letter.sender_id === currentProfileId}
              isAI={Boolean(corr.is_ai_fallback || letter.is_ai_generated)}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: '1px solid rgba(122,138,148,0.18)', paddingTop: 14 }}>
          {error && (
            <div style={{ marginBottom: 8, fontFamily: mono, fontSize: 11, color: '#d15b5b' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            <textarea
              ref={textRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="写回信…"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              style={{
                width: '100%',
                resize: 'vertical',
                border: '1px solid rgba(122,138,148,0.18)',
                background: 'rgba(255,255,255,0.65)',
                padding: '12px 12px 10px',
                outline: 'none',
                fontFamily: serif,
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.8,
                color: C.deep,
              }}
            />

            <button
              onClick={() => void handleSend()}
              disabled={!reply.trim() || sending}
              style={{
                width: 44,
                height: 44,
                border: 'none',
                background: reply.trim() && !sending ? C.tide : 'rgba(122,138,148,0.16)',
                color: reply.trim() && !sending ? 'white' : C.stone,
                cursor: reply.trim() && !sending ? 'pointer' : 'not-allowed',
                fontSize: 16,
              }}
            >
              {sending ? '…' : '↗'}
            </button>
          </div>
          <div style={{ marginTop: 6, fontFamily: mono, fontSize: 9, color: `${C.stone}aa`, textAlign: 'right' }}>⌘↵ 发送</div>
        </div>
      </div>
    </div>
  )
}
