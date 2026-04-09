'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'

type Profile = {
  alias:      string
  avatar_url: string | null
  vibe_tags:  string[]
  write_time: string
  tier:       string
  created_at: string
}

const C = {
  sand:     '#f5f0e8',
  tide:     '#4a8fa8',
  tideDark: '#2e6e8a',
  deep:     '#1a2e3b',
  stone:    '#7a8a94',
}

export default function ProfilePage() {
  const router  = useRouter()
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [email, setEmail]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const serif = 'var(--font-baskerville), Georgia, serif'
  const cn    = 'var(--font-noto-serif-sc), serif'
  const mono  = 'var(--font-dm-mono), monospace'

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      setEmail(user.email ?? null)

      const { data } = await supabase
        .from('profiles')
        .select('alias, avatar_url, vibe_tags, write_time, tier, created_at')
        .eq('auth_id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const daysSince = profile
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
    : 0

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
          我的
        </h1>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em',
                       textTransform: 'uppercase', color: C.stone }}>
          Profile
        </span>
      </header>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.p
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontFamily: cn, color: C.stone, fontSize: 14 }}
          >
            加载中…
          </motion.p>
        </div>
      ) : (
        <div style={{
          flex: 1, padding: '32px 24px',
          maxWidth: 480, margin: '0 auto', width: '100%',
          boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24,
        }}>

          {/* Avatar + alias */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16 }}
          >
            <div style={{
              width: 64, height: 64, flexShrink: 0,
              border: '1px solid rgba(122,138,148,0.2)',
              background: C.sand, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🌊'
              }
            </div>
            <div>
              <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 20,
                          color: C.deep, margin: '0 0 4px' }}>
                {profile?.alias}
              </p>
              <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                          textTransform: 'uppercase', color: C.stone, margin: 0 }}>
                {profile?.tier === 'plus' ? '岸信+ · Shore+' : '免费版 · Free'}
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'rgba(245,240,232,0.8)',
              border: '1px solid rgba(180,165,140,0.2)',
              padding: '20px 24px',
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                          textTransform: 'uppercase', color: C.stone, margin: '0 0 4px' }}>
                加入天数
              </p>
              <p style={{ fontFamily: serif, fontSize: 24, color: C.deep, margin: 0 }}>
                {daysSince}
              </p>
            </div>
            <div>
              <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                          textTransform: 'uppercase', color: C.stone, margin: '0 0 4px' }}>
                写信时间
              </p>
              <p style={{ fontFamily: cn, fontSize: 16, color: C.deep, margin: 0 }}>
                {profile?.write_time === 'morning' ? '清晨'
                  : profile?.write_time === 'night' ? '深夜' : '随时'}
              </p>
            </div>
          </motion.div>

          {/* Vibe tags */}
          {profile?.vibe_tags && profile.vibe_tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em',
                          textTransform: 'uppercase', color: C.stone, margin: '0 0 12px' }}>
                对话偏好
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {profile.vibe_tags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: cn, fontSize: 12, color: C.tideDark,
                    border: '1px solid rgba(74,143,168,0.25)',
                    padding: '4px 12px',
                    background: 'rgba(74,143,168,0.05)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: C.stone, margin: '0 0 6px' }}>
              邮箱
            </p>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14,
                        color: C.deep + '99', margin: 0 }}>
              {email}
            </p>
            <p style={{ fontFamily: mono, fontSize: 9, color: C.stone + '80',
                        margin: '4px 0 0', letterSpacing: '0.1em' }}>
              不会显示给其他用户
            </p>
          </motion.div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Sign out */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              background: 'transparent',
              border: '1px solid rgba(122,138,148,0.3)',
              padding: '12px 24px', width: '100%',
              fontFamily: mono, fontSize: 10,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: C.stone, cursor: 'pointer',
            }}
          >
            {signingOut ? '退出中…' : '退出登录 · Sign out'}
          </motion.button>

        </div>
      )}

    <BottomNav active="profile" />
    </div>
  )
}
