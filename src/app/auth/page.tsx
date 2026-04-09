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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
      <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
      <path d="M4.51 10.53A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.53V5.4H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.6l2.63-2.07z" fill="#FBBC05"/>
      <path d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.4l2.63 2.07c.63-1.89 2.39-3.29 4.47-3.29z" fill="#EA4335"/>
    </svg>
  )
}

export default function AuthPage() {
  const [email, setEmail]         = useState('')
  const [sent, setSent]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError('Google 登录失败，请重试。')
      setGoogleLoading(false)
    }
    // On success browser redirects to Google — no need to setLoading(false)
  }

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
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{
            fontFamily: cn, fontWeight: 900, fontSize: 40,
            color: C.deep, margin: '0 0 6px', letterSpacing: '0.04em',
          }}>
            岸信
          </h1>
          <p style={{
            fontFamily: serif, fontStyle: 'italic',
            fontSize: 14, color: C.stone, margin: 0,
          }}>
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
              style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
            >

              {/* Google login — primary */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                style={{
                  width: '100%', padding: '13px 24px',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.12)',
                  cursor: googleLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 10,
                  fontFamily: mono, fontSize: 11,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: C.deep, opacity: googleLoading ? 0.6 : 1,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  marginBottom: 20,
                }}
              >
                <GoogleIcon />
                {googleLoading ? '跳转中…' : '使用 Google 登录'}
              </button>

              {/* Divider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(122,138,148,0.2)' }} />
                <span style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                  color: C.stone + '80', textTransform: 'uppercase',
                }}>
                  或用邮箱
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(122,138,148,0.2)' }} />
              </div>

              {/* Email magic link — secondary */}
              <form onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{
                    fontFamily: mono, fontSize: 9,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: C.stone, display: 'block', marginBottom: 8,
                  }}>
                    邮箱 · Email
                  </label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
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
                      style={{
                        fontFamily: mono, fontSize: 10,
                        color: '#e57373', letterSpacing: '0.08em', margin: 0,
                      }}
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
                    padding: '13px 24px', width: '100%',
                    fontFamily: mono, fontSize: 11,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                    opacity: !email ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? '发送中…' : '发送登录链接'}
                </button>
              </form>

              <p style={{
                fontFamily: mono, fontSize: 9, color: C.stone + '50',
                textAlign: 'center', letterSpacing: '0.08em',
                marginTop: 24, lineHeight: 1.8,
              }}>
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
              <p style={{
                fontFamily: cn, fontWeight: 700, fontSize: 18,
                color: C.deep, margin: '0 0 8px',
              }}>
                登录链接已发送
              </p>
              <p style={{
                fontFamily: serif, fontStyle: 'italic', fontSize: 13,
                color: C.stone, margin: '0 0 16px', lineHeight: 1.8,
              }}>
                请查收邮件，点击链接登录。<br/>
                Check your inbox and click the link.
              </p>
              <p style={{
                fontFamily: mono, fontSize: 11,
                color: C.stone + '80', margin: '0 0 20px',
                letterSpacing: '0.08em',
              }}>
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
