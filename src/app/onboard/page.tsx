'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const C = {
  sand:     '#f5f0e8',
  sand2:    '#ede6d6',
  tide:     '#4a8fa8',
  tideDark: '#2e6e8a',
  deep:     '#1a2e3b',
  stone:    '#7a8a94',
}

const serif = 'var(--font-baskerville), Georgia, serif'
const cn    = 'var(--font-noto-serif-sc), serif'
const mono  = 'var(--font-dm-mono), monospace'

const VIBE_TAGS = [
  { zh: '深夜聊天', en: 'Late night talks' },
  { zh: '轻松幽默', en: 'Lighthearted' },
  { zh: '创意写作', en: 'Creative writing' },
  { zh: '人生思考', en: 'Life questions' },
  { zh: '随机漫谈', en: 'Random & curious' },
  { zh: '温暖陪伴', en: 'Warmth & support' },
]

const WRITE_TIMES = [
  { id: 'morning' as const, zh: '清晨', en: 'Morning' },
  { id: 'night'   as const, zh: '深夜', en: 'Night owl' },
  { id: 'any'     as const, zh: '随时', en: 'Whenever' },
]

const ALIAS_SUGGESTIONS = [
  '晨雾里的人', '午夜的灯', '雨后的石头', '漂流的云',
  '岸边的树', '深海的鱼', '远山的风', '秋天的信',
]

export default function OnboardPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep]                     = useState<1 | 2 | 3>(1)
  const [alias, setAlias]                   = useState('')
  const [avatarFile, setAvatarFile]         = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview]   = useState<string | null>(null)
  const [selectedVibes, setSelectedVibes]   = useState<string[]>([])
  const [writeTime, setWriteTime]           = useState<'morning' | 'night' | 'any'>('any')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function toggleVibe(zh: string) {
    setSelectedVibes(prev =>
      prev.includes(zh)
        ? prev.filter(v => v !== zh)
        : prev.length < 3 ? [...prev, zh] : prev
    )
  }

  async function handleComplete() {
    if (!alias.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      let avatarUrl: string | null = null

      if (avatarFile) {
        const ext  = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(path)
          avatarUrl = urlData.publicUrl
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          alias:      alias.trim(),
          avatar_url: avatarUrl,
          vibe_tags:  selectedVibes,
          write_time: writeTime,
        })
        .eq('auth_id', user.id)

      if (updateError) throw updateError
      router.push('/shore')
    } catch (err: any) {
      setError(err.message || '出错了，请重试。')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #f5f0e8 0%, #ede6d6 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
      boxSizing: 'border-box',
    }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            height: 2, width: 48,
            background: s <= step ? C.tide : 'rgba(122,138,148,0.2)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Alias ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <div>
                <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: C.tide, margin: '0 0 6px' }}>
                  01 · 笔名
                </p>
                <h2 style={{ fontFamily: cn, fontWeight: 700, fontSize: 24,
                             color: C.deep, margin: '0 0 4px' }}>
                  你想叫什么？
                </h2>
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13,
                            color: C.stone, margin: 0 }}>
                  Choose your pen name
                </p>
              </div>

              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                placeholder="晨雾里的人"
                maxLength={20}
                autoFocus
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', borderBottom: `1px solid ${C.stone}50`,
                  padding: '10px 0',
                  fontFamily: serif, fontStyle: 'italic', fontSize: 18,
                  color: C.deep, outline: 'none', boxSizing: 'border-box',
                }}
              />

              <div>
                <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em',
                            textTransform: 'uppercase', color: C.stone + '80',
                            margin: '0 0 10px' }}>
                  参考建议
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALIAS_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setAlias(s)}
                      style={{
                        fontFamily: cn, fontSize: 12,
                        padding: '6px 12px', cursor: 'pointer',
                        border: `1px solid ${alias === s
                          ? C.tide
                          : 'rgba(122,138,148,0.25)'}`,
                        background: alias === s ? 'rgba(74,143,168,0.07)' : 'transparent',
                        color: alias === s ? C.tide : C.stone,
                        transition: 'all 0.15s',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={alias.trim().length < 2}
                style={{
                  background: alias.trim().length < 2 ? C.stone : C.tide,
                  color: 'white', border: 'none', padding: '14px',
                  fontFamily: cn, fontSize: 15, letterSpacing: '0.1em',
                  cursor: alias.trim().length < 2 ? 'not-allowed' : 'pointer',
                  opacity: alias.trim().length < 2 ? 0.5 : 1,
                  width: '100%',
                }}
              >
                继续 →
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: Avatar + Vibe ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <div>
                <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: C.tide, margin: '0 0 6px' }}>
                  02 · 头像和气质
                </p>
                <h2 style={{ fontFamily: cn, fontWeight: 700, fontSize: 24,
                             color: C.deep, margin: '0 0 4px' }}>
                  你是什么样的人？
                </h2>
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13,
                            color: C.stone, margin: 0 }}>
                  A photo and a vibe
                </p>
              </div>

              {/* Avatar upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 64, height: 64, flexShrink: 0,
                    border: `2px dashed ${avatarPreview
                      ? C.tide
                      : 'rgba(122,138,148,0.3)'}`,
                    background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', padding: 0,
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt=""
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 24 }}>📷</span>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*"
                       onChange={handleAvatarSelect} style={{ display: 'none' }} />
                <div>
                  <p style={{ fontFamily: cn, fontSize: 13, color: C.deep, margin: '0 0 3px' }}>
                    上传头像（可选）
                  </p>
                  <p style={{ fontFamily: mono, fontSize: 9, color: C.stone + '80',
                              letterSpacing: '0.1em', margin: 0 }}>
                    宠物、风景、物品都可以
                  </p>
                </div>
              </div>

              {/* Vibe tags */}
              <div>
                <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em',
                            textTransform: 'uppercase', color: C.stone,
                            margin: '0 0 12px' }}>
                  你喜欢什么样的对话？最多选3个
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {VIBE_TAGS.map(tag => {
                    const selected = selectedVibes.includes(tag.zh)
                    return (
                      <button
                        key={tag.zh}
                        onClick={() => toggleVibe(tag.zh)}
                        style={{
                          padding: '12px', textAlign: 'left', cursor: 'pointer',
                          border: `1px solid ${selected
                            ? C.tide
                            : 'rgba(122,138,148,0.2)'}`,
                          background: selected ? 'rgba(74,143,168,0.08)' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <p style={{ fontFamily: cn, fontSize: 13, fontWeight: 700,
                                    color: selected ? C.tideDark : C.deep,
                                    margin: '0 0 2px' }}>
                          {tag.zh}
                        </p>
                        <p style={{ fontFamily: mono, fontSize: 9,
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                    color: selected ? C.tide : C.stone + '80',
                                    margin: 0 }}>
                          {tag.en}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '12px',
                    border: `1px solid rgba(122,138,148,0.3)`,
                    background: 'transparent', cursor: 'pointer',
                    fontFamily: mono, fontSize: 10,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: C.stone,
                  }}
                >
                  ← 返回
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    flex: 1, padding: '12px',
                    background: C.tide, border: 'none', cursor: 'pointer',
                    fontFamily: cn, fontSize: 14, letterSpacing: '0.08em',
                    color: 'white',
                  }}
                >
                  继续 →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Write time + finish ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <div>
                <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: C.tide, margin: '0 0 6px' }}>
                  03 · 写信时间
                </p>
                <h2 style={{ fontFamily: cn, fontWeight: 700, fontSize: 24,
                             color: C.deep, margin: '0 0 4px' }}>
                  你什么时候写信？
                </h2>
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13,
                            color: C.stone, margin: 0 }}>
                  When do you usually write?
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {WRITE_TIMES.map(wt => {
                  const selected = writeTime === wt.id
                  return (
                    <button
                      key={wt.id}
                      onClick={() => setWriteTime(wt.id)}
                      style={{
                        padding: '16px 8px', textAlign: 'center', cursor: 'pointer',
                        border: `1px solid ${selected
                          ? C.tide
                          : 'rgba(122,138,148,0.2)'}`,
                        background: selected ? 'rgba(74,143,168,0.08)' : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 16,
                                  color: selected ? C.tideDark : C.deep,
                                  margin: '0 0 4px' }}>
                        {wt.zh}
                      </p>
                      <p style={{ fontFamily: mono, fontSize: 8,
                                  letterSpacing: '0.08em', textTransform: 'uppercase',
                                  color: selected ? C.tide : C.stone + '80',
                                  margin: 0 }}>
                        {wt.en}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Preview card */}
              <div style={{
                background: 'rgba(245,240,232,0.9)',
                border: '1px solid rgba(180,165,140,0.2)',
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 48, height: 48, flexShrink: 0,
                  border: '1px solid rgba(122,138,148,0.2)',
                  background: C.sand2, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt=""
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🌊'
                  }
                </div>
                <div>
                  <p style={{ fontFamily: cn, fontWeight: 700, fontSize: 15,
                              color: C.deep, margin: '0 0 3px' }}>
                    {alias}
                  </p>
                  <p style={{ fontFamily: mono, fontSize: 9, color: C.stone,
                              letterSpacing: '0.08em', margin: 0 }}>
                    {selectedVibes.slice(0, 2).join(' · ') || '新的漂流者'}
                  </p>
                </div>
              </div>

              {error && (
                <p style={{ fontFamily: mono, fontSize: 10, color: '#e57373',
                            letterSpacing: '0.1em', textAlign: 'center', margin: 0 }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1, padding: '12px',
                    border: '1px solid rgba(122,138,148,0.3)',
                    background: 'transparent', cursor: 'pointer',
                    fontFamily: mono, fontSize: 10,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: C.stone,
                  }}
                >
                  ← 返回
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '12px',
                    background: loading ? C.stone : C.tide,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: cn, fontSize: 14, letterSpacing: '0.08em',
                    color: 'white',
                  }}
                >
                  {loading ? '保存中…' : '开始漂流 🍶'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
