# 岸信 Shore Letter

> 写给陌生人，让潮水决定。  
> Write to a stranger. Let the tide decide.

**shoreletter.app** · English brand, Mandarin-first UI

---

## Stack

| Layer | Service | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Same as Konvey |
| Database | Supabase Postgres | RLS enabled on all tables |
| Auth | Supabase Auth (magic link) | No passwords |
| Realtime | Supabase Realtime | Live text sync |
| AI | Claude API (Anthropic) | Safety scan + AI fallback |
| Jobs | Inngest | Wednesday Tide cron |
| Payments | Stripe | Shore+ subscription + gifts |
| Email | Resend + React Email | Transactional only |
| Deploy | Vercel | Same as Konvey |
| PWA | next-pwa | Installable, push notifications |

---

## Setup

### 1. Clone and install

```bash
cd C:\Users\liyan\Documents\career\lea-website\ShoreLetter\ShoreLetter
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
# Fill in values — see .env.local.example for all required keys
```

### 3. Supabase setup

1. Create new project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Enable Realtime for `letters` and `correspondences` tables
4. Enable pgvector extension in Extensions tab
5. Copy URL + anon key to `.env.local`

### 4. Run locally

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (waitlist)
│   ├── write/page.tsx        # Write a bottle
│   ├── shore/page.tsx        # Inbox / The Shore
│   ├── letters/[id]/page.tsx # Correspondence thread
│   ├── auth/page.tsx         # Sign in
│   ├── onboard/page.tsx      # Choose alias + avatar
│   └── api/
│       ├── safety/scan/      # Claude content safety
│       ├── match/wednesday/  # Wednesday Tide matching
│       ├── bottles/          # Bottle CRUD
│       ├── letters/          # Letter CRUD
│       └── webhooks/stripe/  # Stripe webhooks
├── components/
│   ├── ui/                   # Base components (Button, Input...)
│   ├── layout/               # Nav, Shell, BottomNav
│   ├── bottle/               # BottleCard, WriteForm, ReleaseAnimation
│   └── letter/               # LetterBubble, CorrespondenceThread
├── lib/
│   ├── supabase.ts           # Client + server Supabase instances
│   ├── anthropic.ts          # Claude API client
│   └── utils.ts              # cn(), date helpers
├── locales/
│   ├── zh/common.json        # Mandarin strings
│   └── en/common.json        # English strings
└── styles/
    └── globals.css           # Design tokens + base styles
```

---

## Phase 1 MVP Checklist

### Week 1–2: Foundation
- [ ] Supabase project created + schema deployed
- [ ] Auth flow (magic link → onboarding → alias)
- [ ] Landing page live on shoreletter.app
- [ ] Waitlist collecting emails

### Week 3–5: Core Loop
- [ ] Write bottle page
- [ ] Safety scan running on every submission
- [ ] Random matching (drift mode)
- [ ] Correspondence thread (async letters)
- [ ] Report + block

### Week 6–8: Ritual
- [ ] Wednesday Tide matching (manual trigger)
- [ ] Push notifications (PWA)
- [ ] Crisis detection banner
- [ ] Admin dashboard (basic)

### MVP Gate
- [ ] 500 active users (Mandarin-speaking)
- [ ] 100 correspondences with 5+ letters
- [ ] Average correspondence age > 14 days
- [ ] Zero safety incidents reaching press

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `sand` | #f5f0e8 | Primary background |
| `water` | #c8dde8 | Accent background |
| `tide` | #4a8fa8 | Primary color, CTAs |
| `deep` | #1a2e3b | Dark mode, headings |
| `stone` | #7a8a94 | Muted text, labels |
| `gold` | #b8943f | Special moments, anniversaries |

**Fonts:** Noto Serif SC (Chinese), Libre Baskerville (letters), DM Mono (UI labels), Lato (body)

---

## GTM Launch Sequence

1. **Week 1:** Post on Little Red Book — "我重建了漂流瓶"
2. **Week 2:** WeChat moments seeding in Chinese diaspora network
3. **Week 3:** First Wednesday Tide (manual, founder-run)
4. **Month 2:** Reddit r/penpals, r/lonely posts
5. **Month 3:** English UI launch

---

*岸信 · shoreletter.app · April 2026*
