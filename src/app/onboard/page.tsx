'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const VIBE_TAGS = [
  { zh: '深夜聊天',  en: 'Late night talks' },
  { zh: '轻松幽默',  en: 'Lighthearted' },
  { zh: '创意写作',  en: 'Creative writing' },
  { zh: '人生思考',  en: 'Life questions' },
  { zh: '随机漫谈',  en: 'Random & curious' },
  { zh: '温暖陪伴',  en: 'Warmth & support' },
]

const WRITE_TIMES = [
  { id: 'morning', zh: '清晨', en: 'Morning person' },
  { id: 'night',   zh: '深夜', en: 'Night owl' },
  { id: 'any',     zh: '随时', en: 'Whenever' },
] as const

// Suggested aliases for inspiration
const ALIAS_SUGGESTIONS = [
  '晨雾里的人', '午夜的灯', '雨后的石头', '漂流的云',
  '岸边的树', '深海的鱼', '远山的风', '秋天的信',
]

export default function OnboardPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep]           = useState<1 | 2 | 3>(1)
  const [alias, setAlias]         = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [writeTime, setWriteTime] = useState<'morning' | 'night' | 'any'>('any')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

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

      // Upload avatar if provided
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

      // Update profile
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

  const canProceed1 = alias.trim().length >= 2
  const canProceed2 = true // avatar is optional

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sand-100 to-sand-200
                    flex flex-col items-center justify-center px-6 py-12">

      {/* Progress */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`h-0.5 w-12 transition-colors duration-300
              ${s <= step ? 'bg-tide' : 'bg-stone-shore/20'}`}
          />
        ))}
      </div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">

          {/* Step 1 — Alias */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase
                              text-tide mb-1">
                  01 · 笔名
                </p>
                <h2 className="font-cn font-bold text-2xl text-deep-700 mb-1">
                  你想叫什么？
                </h2>
                <p className="font-serif italic text-stone-shore text-sm">
                  Choose your pen name
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  placeholder="晨雾里的人"
                  maxLength={20}
                  autoFocus
                  className="input-shore w-full text-lg"
                />
                <p className="font-mono text-[9px] text-stone-shore/50 mt-2
                              tracking-wider">
                  不必是真名，这是别人认识你的方式。
                </p>
              </div>

              {/* Suggestions */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.15em] uppercase
                              text-stone-shore/60 mb-3">
                  参考建议
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALIAS_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setAlias(s)}
                      className={`font-cn text-sm px-3 py-1.5 border
                        transition-colors duration-200
                        ${alias === s
                          ? 'border-tide text-tide bg-tide/5'
                          : 'border-stone-shore/20 text-stone-shore hover:border-tide/40'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceed1}
                className="btn-tide w-full font-cn tracking-widest"
              >
                继续 →
              </button>
            </motion.div>
          )}

          {/* Step 2 — Avatar + Vibe */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase
                              text-tide mb-1">
                  02 · 头像和气质
                </p>
                <h2 className="font-cn font-bold text-2xl text-deep-700 mb-1">
                  你是什么样的人？
                </h2>
                <p className="font-serif italic text-stone-shore text-sm">
                  A photo and a vibe
                </p>
              </div>

              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  className={`w-16 h-16 border-2 border-dashed
                    flex items-center justify-center overflow-hidden
                    transition-colors duration-200
                    ${avatarPreview
                      ? 'border-tide'
                      : 'border-stone-shore/30 hover:border-tide/50'
                    }`}
                >
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="avatar preview"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">📷</span>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <div>
                  <p className="font-cn text-sm text-deep-700">
                    上传头像（可选）
                  </p>
                  <p className="font-mono text-[9px] text-stone-shore/60
                                tracking-wider mt-0.5">
                    宠物、风景、物品都可以
                  </p>
                </div>
              </div>

              {/* Vibe tags */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.15em] uppercase
                              text-stone-shore mb-3">
                  你喜欢什么样的对话？最多选3个
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {VIBE_TAGS.map(tag => (
                    <button
                      key={tag.zh}
                      onClick={() => toggleVibe(tag.zh)}
                      className={`p-3 border text-left transition-all duration-200
                        ${selectedVibes.includes(tag.zh)
                          ? 'border-tide bg-tide/8 text-deep-700'
                          : 'border-stone-shore/20 text-stone-shore hover:border-tide/30'
                        }`}
                    >
                      <p className="font-cn text-sm font-medium">{tag.zh}</p>
                      <p className="font-mono text-[9px] tracking-wider mt-0.5
                                    opacity-60">
                        {tag.en}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-ghost flex-1"
                >
                  ← 返回
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed2}
                  className="btn-tide flex-1 font-cn tracking-widest"
                >
                  继续 →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Write time + finish */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase
                              text-tide mb-1">
                  03 · 写信时间
                </p>
                <h2 className="font-cn font-bold text-2xl text-deep-700 mb-1">
                  你什么时候写信？
                </h2>
                <p className="font-serif italic text-stone-shore text-sm">
                  When do you usually write?
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {WRITE_TIMES.map(wt => (
                  <button
                    key={wt.id}
                    onClick={() => setWriteTime(wt.id)}
                    className={`p-4 border text-center transition-all duration-200
                      ${writeTime === wt.id
                        ? 'border-tide bg-tide/8 text-deep-700'
                        : 'border-stone-shore/20 text-stone-shore hover:border-tide/30'
                      }`}
                  >
                    <p className="font-cn font-bold text-base">{wt.zh}</p>
                    <p className="font-mono text-[9px] tracking-wider mt-1 opacity-60">
                      {wt.en}
                    </p>
                  </button>
                ))}
              </div>

              {/* Preview card */}
              <div className="letter-paper p-5 flex items-center gap-4">
                <div className="w-12 h-12 border border-stone-shore/20
                                flex items-center justify-center overflow-hidden
                                flex-shrink-0">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="preview"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">🌊</span>
                  )}
                </div>
                <div>
                  <p className="font-cn font-bold text-deep-700">{alias}</p>
                  <p className="font-mono text-[9px] text-stone-shore tracking-wider mt-0.5">
                    {selectedVibes.slice(0, 2).join(' · ') || '新的漂流者'}
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-[10px] text-red-400 tracking-wider"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="btn-ghost flex-1"
                >
                  ← 返回
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="btn-tide flex-1 font-cn tracking-widest"
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
