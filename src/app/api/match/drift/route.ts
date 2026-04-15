import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type BottleRecord = {
  id: string
  author_id: string
  language: string
  content: string
  created_at: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { bottleId?: string }
    if (!body.bottleId) {
      return NextResponse.json({ error: 'Missing bottleId' }, { status: 400 })
    }

    const { data: currentBottle, error: currentBottleError } = await supabase
      .from('bottles')
      .select('id, author_id, language, content, created_at, mode, status, safety_flagged')
      .eq('id', body.bottleId)
      .single()

    if (currentBottleError || !currentBottle) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 })
    }

    if (
      currentBottle.mode !== 'drift' ||
      currentBottle.status !== 'drifting' ||
      currentBottle.safety_flagged
    ) {
      return NextResponse.json({ matched: false, reason: 'Bottle is not eligible for drift matching' })
    }

    const { data: candidates, error: candidatesError } = await supabase
      .from('bottles')
      .select('id, author_id, language, content, created_at')
      .eq('mode', 'drift')
      .eq('status', 'drifting')
      .eq('language', currentBottle.language)
      .eq('safety_flagged', false)
      .neq('author_id', currentBottle.author_id)
      .neq('id', currentBottle.id)
      .order('created_at', { ascending: true })
      .limit(30)

    if (candidatesError) {
      throw candidatesError
    }

    const eligibleCandidates = (candidates ?? []) as BottleRecord[]

    for (const candidate of eligibleCandidates) {
      const { data: existingCorr, error: existingCorrError } = await supabase
        .from('correspondences')
        .select('id')
        .or(
          `and(user_a_id.eq.${currentBottle.author_id},user_b_id.eq.${candidate.author_id}),` +
            `and(user_a_id.eq.${candidate.author_id},user_b_id.eq.${currentBottle.author_id})`
        )
        .eq('status', 'active')
        .limit(1)

      if (existingCorrError) {
        throw existingCorrError
      }

      if (existingCorr && existingCorr.length > 0) {
        continue
      }

      const { data: createdCorr, error: createdCorrError } = await supabase
        .from('correspondences')
        .insert({
          bottle_id: currentBottle.id,
          user_a_id: currentBottle.author_id,
          user_b_id: candidate.author_id,
          status: 'active',
          last_read_by_a_at: null,
          last_read_by_b_at: null,
        })
        .select('id')
        .single()

      if (createdCorrError || !createdCorr) {
        throw createdCorrError ?? new Error('Failed to create correspondence')
      }

      const { error: firstLettersError } = await supabase.from('letters').insert([
        {
          correspondence_id: createdCorr.id,
          sender_id: currentBottle.author_id,
          content: currentBottle.content,
        },
        {
          correspondence_id: createdCorr.id,
          sender_id: candidate.author_id,
          content: candidate.content,
        },
      ])

      if (firstLettersError) {
        throw firstLettersError
      }

      const { error: bottleUpdateError } = await supabase
        .from('bottles')
        .update({ status: 'found' })
        .in('id', [currentBottle.id, candidate.id])

      if (bottleUpdateError) {
        throw bottleUpdateError
      }

      return NextResponse.json({
        matched: true,
        correspondenceId: createdCorr.id,
        partnerBottleId: candidate.id,
      })
    }

    return NextResponse.json({ matched: false })
  } catch (error) {
    console.error('Drift matching failed:', error)
    return NextResponse.json({ error: 'Drift matching failed' }, { status: 500 })
  }
}
