'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type BottleMode = 'drift' | 'wednesday'

type DailyPrompt = {
  prompt_zh: string
}

const MIN_CHARS = 80
const MAX_CHARS = 1200

const C = {
  sand: '#f5f0e8',
  tide: '#4a8fa8',
  tideDark: '#2e6e8a',
  deep: '#1a2e3b',
  stone: '#7a8a94',
  water: '#c8dde8',
}

function WaveRelease({ onComplete }: { onComplete: () => void }) {
  const serif = 'var(--font-baskerville), Georgia, serif'
  const cn = 'var(--font-noto-serif-sc), serif'
  const mono = 'var(--font-dm-mono), monospace'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.sand,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, textAlign: 'center' }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.2, opacity: 0.5 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 2.2, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: '50% auto auto 50%',
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              borderRadius: '50%',
              border: `1px solid ${C.tide}`,
            }}
          />
        ))}

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(245,240,232,0.92)',
            border: '1px solid rgba(122,138,148,0.18)',
            padding: '36px 28px',
          }}
        >
          <p style={{ margin: '0 0 10px', fontFamily: cn, fontSize: 24, color: C.deep }}>你的信漂出去了。</p>
          <p style={{ margin: '0 0 10px', fontFamily: serif, fontStyle: 'italic', color: C.stone }}>
            Your letter is on the water.
          </p>
          <p style={{ margin: 0, fontFamily: cn, fontSize: 14, color: C.stone }}>
            有人找到它时，我们会在岸边提醒你。
          </p>

          <button
            onClick={onComplete}
            style={{
              marginTop: 24,
              border: 'none',
              background: C.tide,
              color: 'white',
              padding: '12px 18px',
              cursor: 'pointer',
              fontFamily: mono,
              letterSpacing: '0.1em',
            }}
          >
            返回 ↩
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WritePage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<BottleMode>('drift')
  const [prompt, setPrompt] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(true)
  const [releasing, setReleasing] = useState(false)
  const [released, setReleased] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serif = 'var(--font-baskerville), Georgia, serif'
  const cn = 'var(--font-noto-serif-sc), serif'
  const mono = 'var(--font-dm-mono), monospace'

  const charCount = content.length
  const isReady = charCount >= MIN_CHARS
  const isOverLimit = charCount > MAX_CHARS

  useEffect(() => {
    async function fetchPrompt() {
      const supabase = createClient()
      const { data } = await supabase.from('daily_prompts').select('prompt_zh').eq('active', true).limit(10)

      const prompts = (data ?? []) as DailyPrompt[]
      if (prompts.length === 0) return

      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      )
      setPrompt(prompts[dayOfYear % prompts.length].prompt_zh)
    }

    void fetchPrompt()
  }, [])

  async function handleRelease() {
    if (!isReady || isOverLimit || releasing) return

    setReleasing(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      const { data: profile } = await supabase.from('profiles').select('id').eq('auth_id', user.id).single()
      if (!profile) throw new Error('未找到用户')

      const safetyRes = await fetch('/api/safety/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const safety = await safetyRes.json()

      if (!safetyRes.ok || typeof safety?.score !== 'number') {
        throw new Error('内容检查失败，请重试。')
      }

      if (safety.score < 0.4) {
        setError('这封信包含不适合的内容，无法发送。')
        setReleasing(false)
        return
      }

      const { data: insertedBottle, error: insertError } = await supabase
        .from('bottles')
        .insert({
          author_id: profile.id,
          content: content.trim(),
          prompt_used: showPrompt ? prompt : null,
          mode,
          language: 'zh',
          safety_score: safety.score,
        })
        .select('id')
        .single()

      if (insertError || !insertedBottle) {
        throw insertError ?? new Error('信件放漂失败')
      }

      if (mode === 'drift') {
        await fetch('/api/match/drift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bottleId: insertedBottle.id }),
        }).catch(() => {
          // Keep the write flow resilient even if matching fails.
        })
      }

      setReleased(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '出错了，请重试。'
      setError(message)
      setReleasing(false)
    }
  }

  if (released) {
    return (
      <WaveRelease
        onComplete={() => {
          setReleased(false)
          setContent('')
          setReleasing(false)
          router.push('/shore')
        }}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.sand, padding: '28px 20px 40px' }}>
      <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'grid', gap: 18 }}>
        <div>
          <p style={{ margin: 0, fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', color: C.stone }}>
            WRITE
          </p>
          <h1 style={{ margin: '8px 0 2px', fontFamily: cn, fontSize: 32, color: C.deep }}>写一封信</h1>
          <p style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', color: C.stone }}>Write</p>
        </div>

        {prompt && showPrompt && (
          <div
            style={{
              position: 'relative',
              border: '1px solid rgba(122,138,148,0.18)',
              background: 'rgba(200,221,232,0.22)',
              padding: '18px 18px 20px',
            }}
          >
            <button
              onClick={() => setShowPrompt(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: mono,
                fontSize: 9,
                color: C.stone,
                letterSpacing: '0.12em',
              }}
            >
              跳过
            </button>
            <p style={{ margin: '0 0 10px', fontFamily: mono, fontSize: 10, color: C.stone, letterSpacing: '0.14em' }}>
              今日提示
            </p>
            <p style={{ margin: 0, fontFamily: cn, fontSize: 18, lineHeight: 1.7, color: C.deep }}>{prompt}</p>
          </div>
        )}

        <div
          style={{
            border: '1px solid rgba(122,138,148,0.18)',
            background: 'rgba(255,255,255,0.42)',
            padding: '20px 18px 14px',
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="从这里开始写……"
            maxLength={MAX_CHARS + 100}
            style={{
              width: '100%',
              minHeight: 260,
              resize: 'vertical',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 16,
              lineHeight: 1.9,
              color: C.deep,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                color: isOverLimit ? '#d15b5b' : isReady ? C.tide : C.stone,
              }}
            >
              {charCount < MIN_CHARS
                ? `还需 ${MIN_CHARS - charCount} 字`
                : isOverLimit
                  ? `超出 ${charCount - MAX_CHARS} 字`
                  : `${charCount} 字 ✓`}
            </span>
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 12px', fontFamily: mono, fontSize: 10, color: C.stone, letterSpacing: '0.16em' }}>
            漂流方式
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'drift' as BottleMode, title: '随机漂流', desc: '优先尝试即时配对' },
              { id: 'wednesday' as BottleMode, title: '星期三潮汐', desc: '本周三晚 8 点' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                style={{
                  border: `1px solid ${mode === item.id ? C.tide : 'rgba(122,138,148,0.18)'}`,
                  background: mode === item.id ? 'rgba(74,143,168,0.08)' : 'transparent',
                  padding: '16px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontFamily: cn, fontWeight: 700, color: C.deep, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.stone, letterSpacing: '0.08em' }}>{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ margin: 0, fontFamily: mono, fontSize: 11, color: '#d15b5b', textAlign: 'center' }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleRelease}
          disabled={!isReady || isOverLimit || releasing}
          style={{
            border: 'none',
            background: !isReady || isOverLimit ? C.stone : C.tide,
            color: 'white',
            padding: '16px 24px',
            cursor: !isReady || isOverLimit || releasing ? 'not-allowed' : 'pointer',
            opacity: !isReady || isOverLimit ? 0.5 : 1,
            fontFamily: cn,
            fontSize: 16,
            letterSpacing: '0.08em',
          }}
        >
          {releasing ? '放漂中…' : '放漂这封信 ↗'}
        </button>

        <p style={{ margin: 0, textAlign: 'center', fontFamily: serif, fontStyle: 'italic', color: `${C.stone}bb` }}>
          Release this letter
        </p>
      </div>
    </div>
  )
}
