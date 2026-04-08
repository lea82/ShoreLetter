'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

type BottleMode = 'drift' | 'wednesday'

const MIN_CHARS = 80
const MAX_CHARS = 1200

// Wave release animation overlay
function WaveRelease({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center
                 bg-gradient-to-b from-deep-700 to-deep-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Expanding rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-water-300/30"
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          transition={{ delay: i * 0.3, duration: 1.4, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-center z-10"
      >
        {/* Bottle floating away */}
        <motion.div
          animate={{ y: [-20, -60], opacity: [1, 0] }}
          transition={{ delay: 0.3, duration: 1.2, ease: 'easeIn' }}
          className="text-5xl mb-8 flex justify-center"
        >
          🍶
        </motion.div>

        <p className="font-cn font-bold text-2xl text-sand-100 mb-2">
          你的信漂出去了。
        </p>
        <p className="font-serif italic text-water-300 text-base mb-6">
          Your letter is on the water.
        </p>
        <p className="font-mono text-[10px] text-water-300/60 tracking-widest uppercase">
          有人找到它时，我们会通知你。
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onComplete}
        className="absolute bottom-12 font-mono text-[10px] tracking-widest
                   uppercase text-water-300/50 hover:text-water-300
                   transition-colors duration-200"
      >
        返回 ↩
      </motion.button>
    </motion.div>
  )
}

export default function WritePage() {
  const [content, setContent]         = useState('')
  const [mode, setMode]               = useState<BottleMode>('drift')
  const [prompt, setPrompt]           = useState<string | null>(null)
  const [showPrompt, setShowPrompt]   = useState(true)
  const [releasing, setReleasing]     = useState(false)
  const [released, setReleased]       = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const charCount   = content.length
  const isReady     = charCount >= MIN_CHARS
  const isOverLimit = charCount > MAX_CHARS

  // Fetch today's prompt
  useEffect(() => {
    async function fetchPrompt() {
      const supabase = createClient()
      const { data } = await supabase
        .from('daily_prompts')
        .select('prompt_zh')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data && data.length > 0) {
        // Rotate by day of year
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

      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!profile) throw new Error('未找到用户')

      // Safety scan via API route
      const safetyRes = await fetch('/api/safety/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const safetyData = await safetyRes.json()

      if (safetyData.score < 0.4) {
        setError('这封信包含不适合的内容，无法发送。')
        setReleasing(false)
        return
      }

      // Insert bottle
      const { error: insertError } = await supabase
        .from('bottles')
        .insert({
          author_id:   profile.id,
          content,
          prompt_used: showPrompt ? prompt : null,
          mode,
          language:    'zh',
          safety_score: safetyData.score,
        })

      if (insertError) throw insertError

      setReleased(true)
    } catch (err: any) {
      setError(err.message || '出错了，请重试。')
      setReleasing(false)
    }
  }

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
    <div className="min-h-dvh bg-gradient-to-b from-sand-100 to-sand-200
                    flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between
                         border-b border-black/5">
        <h1 className="font-cn font-bold text-deep-700 text-lg tracking-wide">
          写一封信
        </h1>
        <span className="font-mono text-[10px] text-stone-shore tracking-wider uppercase">
          Write
        </span>
      </header>

      <div className="flex-1 flex flex-col px-6 py-6 max-w-xl mx-auto w-full gap-5">

        {/* Prompt card */}
        <AnimatePresence>
          {prompt && showPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="letter-paper p-4 relative"
            >
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase
                            text-tide mb-2">
                今日提示
              </p>
              <p className="font-serif italic text-deep-700/80 text-sm
                            leading-relaxed">
                {prompt}
              </p>
              <button
                onClick={() => setShowPrompt(false)}
                className="absolute top-3 right-3 font-mono text-[9px]
                           text-stone-shore hover:text-tide tracking-wider
                           transition-colors uppercase"
              >
                跳过
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text area */}
        <div className="flex-1 flex flex-col">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="从这里开始写……"
            maxLength={MAX_CHARS + 100}
            className="flex-1 w-full min-h-[280px] bg-transparent resize-none
                       font-serif italic text-base text-deep-700
                       placeholder:text-stone-shore/40
                       focus:outline-none leading-relaxed
                       border-b border-stone-shore/20 pb-4"
          />

          {/* Char count */}
          <div className="flex justify-between items-center mt-2 py-2">
            <span className={`font-mono text-[10px] tracking-wider
              ${isOverLimit ? 'text-red-400' :
                isReady ? 'text-tide' : 'text-stone-shore'}`}>
              {charCount < MIN_CHARS
                ? `还需 ${MIN_CHARS - charCount} 字`
                : isOverLimit
                  ? `超出 ${charCount - MAX_CHARS} 字`
                  : `${charCount} 字 ✓`}
            </span>
            <span className="font-mono text-[10px] text-stone-shore/40 tracking-wider">
              {MAX_CHARS - charCount > 0 ? `${MAX_CHARS - charCount} 字剩余` : ''}
            </span>
          </div>
        </div>

        {/* Mode selector */}
        <div>
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase
                        text-stone-shore mb-3">
            漂流方式
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              {
                id:   'drift' as BottleMode,
                cn:   '随机漂流',
                en:   'Random drift',
                icon: '🌊',
                desc: '让海浪决定',
              },
              {
                id:   'wednesday' as BottleMode,
                cn:   '星期三潮汐',
                en:   'Wednesday Tide',
                icon: '🗓',
                desc: '本周三晚8点',
              },
            ] as const).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-4 border text-left transition-all duration-200
                  ${mode === m.id
                    ? 'border-tide bg-tide/8 text-deep-700'
                    : 'border-stone-shore/20 text-stone-shore hover:border-tide/40'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{m.icon}</span>
                  <span className="font-cn font-bold text-sm">{m.cn}</span>
                </div>
                <p className="font-mono text-[9px] tracking-wider text-stone-shore uppercase">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[10px] text-red-400 tracking-wider text-center"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Release button */}
        <motion.button
          onClick={handleRelease}
          disabled={!isReady || isOverLimit || releasing}
          whileTap={{ scale: 0.98 }}
          className={`btn-tide w-full font-cn text-base tracking-widest py-4
            ${(!isReady || isOverLimit) ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {releasing ? '放漂中…' : '放漂这封信 ↗'}
        </motion.button>

        <p className="font-serif italic text-center text-[11px] text-stone-shore/60">
          Release this letter
        </p>

      </div>
    </div>
  )
}
