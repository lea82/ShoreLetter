'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const C = {
  sand:     '#f5f0e8',
  tide:     '#4a8fa8',
  tideDark: '#2e6e8a',
  deep:     '#1a2e3b',
  stone:    '#7a8a94',
}

const serif = 'var(--font-baskerville), Georgia, serif'
const cn    = 'var(--font-noto-serif-sc), serif'
const mono  = 'var(--font-dm-mono), monospace'

export default function AuthPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

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
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #f5f0e8 0%, #ddeaf2 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative',
    }}>

      {/* Back */}
      <Link href="/" style={{
        position: 'absolute', top: 24, left: 24,
        fontFamily: mono, fontSize: 10, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: C.stone,
        textDecoration: 'none',
      }}>
        ← 返回
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 360 }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: cn, fontWeight: 900, fontSize: 40,
                       color: C.deep, margin: '0 0 6px', letterSpacing: '0.04em' }}>
            岸信
          </h1>
          <p style={{ fontFamily: serif, fontStyle: 'italic',
                      fontSize: 14, color: C.stone, margin: 0 }}>
            Shore Letter
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p style={{ fontFamily: cn, textAlign: 'center', fontSize: 14,
                          color: C.deep + 'bb', margin: '0 0 32px',
                          lineHeight: 1.8 }}>
                输入邮箱，我们发送一个登录链接。<br/>
                <span style={{ fontFamily: serif, fontStyle: 'italic',
                               fontSize: 12, color: C.stone }}>
                  No password needed.
                </span>
              </p>

              <form onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontFamily: mono, fontSize: 9,
                                  letterSpacing: '0.2em', textTransform: 'uppercase',
                                  color: C.stone, display: 'block', marginBottom: 8 }}>
                    邮箱 · Email
                  </label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required autoFocus
                    style={{
                      width: '100%', background: 'transparent',
                      border: 'none', borderBottom: `1px solid ${C.stone}50`,
                      padding: '10px 0',
                      fontFamily: serif, fontStyle: 'italic', fontSize: 16,
                      color: C.deep, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ fontFamily: mono, fontSize: 10,
                               color: '#e57373', letterSpacing: '0.08em', margin: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit" disabled={loading || !email}
                  style={{
                    background: (loading || !email) ? C.stone : C.tide,
                    color: 'white', border: 'none',
                    padding: '14px 24px', width: '100%',
                    fontFamily: cn, fontSize: 15, letterSpacing: '0.1em',
                    cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                    opacity: !email ? 0.5 : 1,
                    marginTop: 8,
                  }}
                >
                  {loading ? '发送中…' : '发送登录链接'}
                </button>
              </form>

              <p style={{ fontFamily: mono, fontSize: 9, color: C.stone + '60',
                          textAlign: 'center', letterSpacing: '0.1em',
                          marginTop: 24, lineHeight: 1.8 }}>
                登录即表示同意用户协议和隐私政策<br/>
                你的邮箱不会显示给任何其他用户。
              </p>
            </motion.div>

          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'rgba(245,240,232,0.95)',
                border: '1px solid rgba(180,165,140,0.2)',
                padding: 32, textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>✉️</div>
              <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 18,
                          color: C.deep, margin: '0 0 8px' }}>
                登录链接已发送
              </p>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13,
                          color: C.stone, margin: '0 0 16px', lineHeight: 1.8 }}>
                请查收邮件，点击链接登录。<br/>
                Check your inbox and click the link.
              </p>
              <p style={{ fontFamily: mono, fontSize: 11,
                          color: C.stone + '80', margin: '0 0 20px',
                          letterSpacing: '0.08em' }}>
                {email}
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: mono, fontSize: 9, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: C.stone,
                }}
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
