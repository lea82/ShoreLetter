import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Correspondence age in days
export function corrAgeDays(createdAt: string): number {
  return Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 86400000
  )
}

// Wednesday Tide countdown
export function nextWednesdayTide(): Date {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 3=Wed
  const daysUntilWed = (3 - day + 7) % 7 || 7
  const nextWed = new Date(now)
  nextWed.setDate(now.getDate() + daysUntilWed)
  nextWed.setHours(20, 0, 0, 0) // 8pm
  return nextWed
}

// Is today Wednesday and after 8pm
export function isTideTime(): boolean {
  const now = new Date()
  return now.getDay() === 3 && now.getHours() >= 20
}

// Truncate letter preview
export function letterPreview(content: string, maxLength = 60): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '…'
}

// Generate random alias suggestion
const ALIAS_PREFIXES = ['晨雾', '午夜', '秋雨', '流云', '深海', '远山', '暮色', '春风']
const ALIAS_SUFFIXES = ['里的人', '的灯', '的信', '的鱼', '的风', '的影', '漫步者', '守望者']

export function randomAlias(): string {
  const prefix = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)]
  const suffix = ALIAS_SUFFIXES[Math.floor(Math.random() * ALIAS_SUFFIXES.length)]
  return prefix + suffix
}

// Format relative date in Chinese
export function relativeDate(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)   return '刚刚'
  if (mins < 60)  return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7)   return `${days}天前`
  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day:   'numeric',
  })
}
