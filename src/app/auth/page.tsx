'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function AuthPage() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      setError(`发送失败：${authError.message}`)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sand-100 to-water-100
                    flex flex-col items-center justify-center px-6">

      {/* Back */}
      <Link
        href="/"
        className="absolute top-6 left-6 font-mono text-[10px] tracking-widest
                   uppercase text-stone-shore hover:text-tide transition-colors"
      >
        ← 返回
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="font-cn font-black text-4xl text-deep-700 mb-2">岸信</h1>
          <p className="font-serif italic text-stone-shore text-sm">Shore Letter</p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-cn text-center text-deep-700/70 text-sm mb-8 leading-relaxed">
                输入邮箱，我们发送一个登录链接。<br />
                <span className="font-serif italic text-stone-shore text-xs">
                  No password needed.
                </span>
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase
                                    text-stone-shore block mb-2">
                    邮箱 · Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    className="input-shore w-full text-base"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-[10px] text-red-400 tracking-wider"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-tide w-full font-cn tracking-widest mt-2"
                >
                  {loading ? '发送中…' : '发送登录链接'}
                </button>
              </form>

              <p className="font-mono text-[9px] text-stone-shore/50 text-center
                            tracking-wider mt-6 leading-relaxed">
                登录即表示同意《用户协议》和《隐私政策》<br/>
                你的邮箱不会显示给任何其他用户。
              </p>
            </motion.div>

          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="letter-paper p-8 text-center"
            >
              <div className="text-4xl mb-4">✉️</div>
              <p className="font-cn font-bold text-deep-700 text-lg mb-2">
                登录链接已发送
              </p>
              <p className="font-serif italic text-stone-shore text-sm mb-4
                            leading-relaxed">
                请查收邮件，点击链接登录。<br/>
                Check your inbox and click the link.
              </p>
              <p className="font-mono text-[10px] text-stone-shore/60 tracking-wider">
                {email}
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 font-mono text-[9px] tracking-widest uppercase
                           text-stone-shore hover:text-tide transition-colors"
              >
                重新发送
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
