import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Wednesday Tide Matching Algorithm
 *
 * Called by Inngest cron every Wednesday at 8pm PT
 * Can also be triggered manually by founder during beta
 *
 * Matching priority:
 * 1. Same language (hard requirement)
 * 2. Similar vibe tags (overlap score)
 * 3. Compatible write_time (soft preference)
 * 4. Trust score >= 10 (safety filter)
 * 5. Not already in active correspondence together
 */
export async function POST(req: NextRequest) {
  // Verify this is called by Inngest or internal admin
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.INNGEST_SIGNING_KEY}` &&
      authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tideDate = new Date().toISOString().split('T')[0]

  try {
    // 1. Get all bottles in wednesday mode that are still drifting
    const { data: bottles, error: bottlesError } = await supabase
      .from('bottles')
      .select(`
        id, author_id, language, content,
        profiles!bottles_author_id_fkey (
          id, alias, vibe_tags, write_time, trust_score, tier
        )
      `)
      .eq('mode', 'wednesday')
      .eq('status', 'drifting')
      .eq('safety_flagged', false)
      .gte('profiles.trust_score', 10)

    if (bottlesError) throw bottlesError
    if (!bottles || bottles.length < 2) {
      return NextResponse.json({
        message: 'Not enough bottles for matching',
        count: bottles?.length ?? 0,
      })
    }

    // 2. Group by language
    const byLanguage: Record<string, typeof bottles> = {}
    for (const bottle of bottles) {
      const lang = bottle.language
      if (!byLanguage[lang]) byLanguage[lang] = []
      byLanguage[lang].push(bottle)
    }

    let matchedPairs   = 0
    let aiFallbacks    = 0
    const participants = bottles.length

    // 3. Match within each language group
    for (const [_lang, langBottles] of Object.entries(byLanguage)) {
      const unmatched = [...langBottles]
      const shuffled  = unmatched.sort(() => Math.random() - 0.5)

      // Simple pairing: iterate and find best vibe match
      const paired = new Set<string>()

      for (let i = 0; i < shuffled.length; i++) {
        if (paired.has(shuffled[i].id)) continue

        const bottleA = shuffled[i]
        let bestMatch = -1
        let bestScore = -1

        for (let j = i + 1; j < shuffled.length; j++) {
          if (paired.has(shuffled[j].id)) continue

          const bottleB = shuffled[j]

          // Skip if same author
          if (bottleA.author_id === bottleB.author_id) continue

          // Check not already in active correspondence
          const { data: existing } = await supabase
            .from('correspondences')
            .select('id')
            .or(
              `and(user_a_id.eq.${bottleA.author_id},user_b_id.eq.${bottleB.author_id}),` +
              `and(user_a_id.eq.${bottleB.author_id},user_b_id.eq.${bottleA.author_id})`
            )
            .eq('status', 'active')
            .limit(1)

          if (existing && existing.length > 0) continue

          // Score vibe tag overlap
          const tagsA = (bottleA.profiles as any)?.vibe_tags ?? []
          const tagsB = (bottleB.profiles as any)?.vibe_tags ?? []
          const overlap = tagsA.filter((t: string) => tagsB.includes(t)).length
          const vibeScore = overlap / Math.max(tagsA.length + tagsB.length, 1)

          // Score write_time compatibility
          const wtA = (bottleA.profiles as any)?.write_time
          const wtB = (bottleB.profiles as any)?.write_time
          const timeScore = (wtA === wtB || wtA === 'any' || wtB === 'any') ? 0.3 : 0

          const totalScore = vibeScore + timeScore

          if (totalScore > bestScore) {
            bestScore = totalScore
            bestMatch = j
          }
        }

        if (bestMatch !== -1) {
          // Create correspondence
          const bottleB = shuffled[bestMatch]

          await supabase.from('correspondences').insert({
            bottle_id:  bottleA.id,
            user_a_id:  bottleA.author_id,
            user_b_id:  bottleB.author_id,
            status:     'active',
          })

          // Create first letter from bottle A content
          const { data: corr } = await supabase
            .from('correspondences')
            .select('id')
            .eq('bottle_id', bottleA.id)
            .single()

          if (corr) {
            await supabase.from('letters').insert({
              correspondence_id: corr.id,
              sender_id:         bottleA.author_id,
              content:           bottleA.content,
            })
          }

          // Mark both bottles as found
          await supabase
            .from('bottles')
            .update({ status: 'found' })
            .in('id', [bottleA.id, bottleB.id])

          paired.add(bottleA.id)
          paired.add(bottleB.id)
          matchedPairs++

          // TODO: Send push notifications to both users
        }
      }

      // 4. Unmatched bottles get AI fallback
      for (const bottle of shuffled) {
        if (!paired.has(bottle.id)) {
          // TODO: Create AI fallback correspondence
          // This calls the AI companion to send the first reply
          aiFallbacks++
        }
      }
    }

    // 5. Record tide stats
    await supabase.from('wednesday_tides').upsert({
      tide_date:    tideDate,
      participants,
      matched_pairs: matchedPairs,
      ai_fallbacks:  aiFallbacks,
      completed_at:  new Date().toISOString(),
    }, { onConflict: 'tide_date' })

    return NextResponse.json({
      success:      true,
      tide_date:    tideDate,
      participants,
      matched_pairs: matchedPairs,
      ai_fallbacks:  aiFallbacks,
    })

  } catch (error: any) {
    console.error('Wednesday Tide error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
