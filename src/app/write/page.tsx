'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type BottleMode = 'drift' | 'wednesday'

const MIN_CHARS = 80
const MAX_CHARS = 1200

const C = {
  sand:     '#f5f0e8',
  tide:     '#4a8fa8',
  tideDark: '#2e6e8a',
  deep:     '#1a2e3b',
  stone:    '#7a8a94',
  water:    '#c8dde8',
}

function WaveRelease({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a2e3b 0%, #0d1820 100%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Expanding rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', borderRadius: '50%',
            border: '1px solid rgba(200,221,232,0.2)',
          }}
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          transition={{ delay: i * 0.3, duration: 1.4, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}
      >
        <motion.div
          animate={{ y: [-20, -60], opacity: [1, 0] }}
          transition={{ delay: 0.3, duration: 1.2, ease: 'easeIn' }}
          style={{ fontSize: 48, marginBottom: 32, display: 'flex', justifyContent: 'center' }}
        >
          🍶
        </motion.div>

        <p style={{
          fontFamily: 'var(--font-noto-serif-sc), serif',
          fontWeight: 700, fontSize: 22,
          color: '#f5f0e8', margin: '0 0 8px',
        }}>
          你的信漂出去了。
        </p>
        <p style={{
          fontFamily: 'var(--font-baskerville), Georgia, serif',
          fontStyle: 'italic', fontSize: 15,
          color: 'rgba(200,221,232,0.8)', margin: '0 0 20px',
        }}>
          Your letter is on the water.
        </p>
        <p style={{
          fontFamily: 'var(--font-dm-mono), monospace',
          fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'rgba(200,221,232,0.5)', margin: 0,
        }}>
          有人找到它时，我们会通知你。
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onComplete}
        style={{
          position: 'absolute', bottom: 48,
          fontFamily: 'var(--font-dm-mono), monospace',
          fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'rgba(200,221,232,0.5)', background: 'none', border: 'none',
          cursor: 'pointer',
        }}
      >
        返回 ↩
      </motion.button>
    </motion.div>
  )
}

export default function WritePage() {
  const router = useRouter()
  const [content, setContent]       = useState('')
  const [mode, setMode]             = useState<BottleMode>('drift')
  const [prompt, setPrompt]         = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(true)
  const [releasing, setReleasing]   = useState(false)
  const [released, setReleased]     = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const charCount   = content.length
  const isReady     = charCount >= MIN_CHARS
  const isOverLimit = charCount > MAX_CHARS

  useEffect(() => {
    async function fetchPrompt() {
      const supabase = createClient()
      const { data } = await supabase
        .from('daily_prompts')
        .select('prompt_zh')
        .eq('active', true)
        .limit(10)

      if (data && data.length > 0) {
        const dayOfYear = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
        )
        setPrompt(data[dayOfYear % data.length].prompt_zh)
      }
    }
    fetchPrompt()
  }, [])

  async function handleRelease() {
    if (!isReady || isOverLimit || releasing) return
    setReleasing(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!profile) throw new Error('未找到用户')

      const safetyRes = await fetch('/api/safety/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const safety = await safetyRes.json()

      if (safety.score < 0.4) {
        setError('这封信包含不适合的内容，无法发送。')
        setReleasing(false)
        return
      }

      const { error: insertError } = await supabase
        .from('bottles')
        .insert({
          author_id:    profile.id,
          content,
          prompt_used:  showPrompt ? prompt : null,
          mode,
          language:     'zh',
          safety_score: safety.score,
        })

      if (insertError) throw insertError
      setReleased(true)
    } catch (err: any) {
      setError(err.message || '出错了，请重试。')
      setReleasing(false)
    }
  }

  const serif = 'var(--font-baskerville), Georgia, serif'
  const cn    = 'var(--font-noto-serif-sc), serif'
  const mono  = 'var(--font-dm-mono), monospace'

  if (released) {
    return (
      <AnimatePresence>
        <WaveRelease onComplete={() => {
          setReleased(false)
          setContent('')
          setReleasing(false)
        }} />
      </AnimatePresence>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #f5f0e8 0%, #ede6d6 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <h1 style={{ fontFamily: cn, fontWeight: 700, fontSize: 18, color: C.deep, margin: 0 }}>
          写一封信
        </h1>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em',
                       textTransform: 'uppercase', color: C.stone }}>
          Write
        </span>
      </header>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '24px', maxWidth: 560, margin: '0 auto', width: '100%', gap: 20,
        boxSizing: 'border-box',
      }}>

        {/* Prompt card */}
        <AnimatePresence>
          {prompt && showPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(245,240,232,0.95)',
                border: '1px solid rgba(180,165,140,0.2)',
                padding: '16px', position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: C.tide, margin: '0 0 8px' }}>
                今日提示
              </p>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13,
                          color: C.deep + 'cc', lineHeight: 1.65, margin: 0 }}>
                {prompt}
              </p>
              <button
                onClick={() => setShowPrompt(false)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: C.stone,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                跳过
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="从这里开始写……"
            maxLength={MAX_CHARS + 100}
            style={{
              flex: 1, minHeight: 240, width: '100%',
              background: 'transparent', resize: 'none',
              fontFamily: serif, fontStyle: 'italic',
              fontSize: 15, color: C.deep, lineHeight: 1.8,
              border: 'none', borderBottom: '1px solid rgba(122,138,148,0.2)',
              paddingBottom: 12, outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Char count */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        padding: '8px 0', alignItems: 'center' }}>
            <span style={{
              fontFamily: mono, fontSize: 10, letterSpacing: '0.1em',
              color: isOverLimit ? '#e57373' : isReady ? C.tide : C.stone,
            }}>
              {charCount < MIN_CHARS
                ? `还需 ${MIN_CHARS - charCount} 字`
                : isOverLimit
                  ? `超出 ${charCount - MAX_CHARS} 字`
                  : `${charCount} 字 ✓`}
            </span>
          </div>
        </div>

        {/* Mode selector */}
        <div>
          <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: C.stone, margin: '0 0 12px' }}>
            漂流方式
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { id: 'drift' as BottleMode,     cn: '随机漂流', icon: '🌊', desc: '让海浪决定' },
              { id: 'wednesday' as BottleMode, cn: '星期三潮汐', icon: '🗓', desc: '本周三晚8点' },
            ]).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  padding: '16px', textAlign: 'left', cursor: 'pointer',
                  border: `1px solid ${mode === m.id ? C.tide : 'rgba(122,138,148,0.2)'}`,
                  background: mode === m.id ? 'rgba(74,143,168,0.06)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <span style={{ fontFamily: cn, fontWeight: 700, fontSize: 13, color: C.deep }}>
                    {m.cn}
                  </span>
                </div>
                <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em',
                            color: C.stone, textTransform: 'uppercase', margin: 0 }}>
                  {m.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontFamily: mono, fontSize: 10, color: '#e57373',
                       letterSpacing: '0.1em', textAlign: 'center', margin: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Release button */}
        <button
          onClick={handleRelease}
          disabled={!isReady || isOverLimit || releasing}
          style={{
            background: (!isReady || isOverLimit) ? C.stone : C.tide,
            color: 'white', border: 'none',
            padding: '16px 24px', width: '100%',
            fontFamily: cn, fontSize: 15, letterSpacing: '0.1em',
            cursor: (!isReady || isOverLimit || releasing) ? 'not-allowed' : 'pointer',
            opacity: (!isReady || isOverLimit) ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          {releasing ? '放漂中…' : '放漂这封信 ↗'}
        </button>

        <p style={{ fontFamily: serif, fontStyle: 'italic', textAlign: 'center',
                    fontSize: 11, color: C.stone + '80', margin: 0 }}>
          Release this letter
        </p>

      </div>
    </div>
  )
}
