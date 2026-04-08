import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// Crisis keywords — trigger resource banner, not blocking
const CRISIS_KEYWORDS_ZH = [
  '自杀', '不想活', '活不下去', '结束生命', '自残', '伤害自己'
]
const CRISIS_KEYWORDS_EN = [
  'suicide', 'kill myself', "don't want to live", 'end my life',
  'self-harm', 'hurt myself'
]

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ score: 0.5, crisis: false })
    }

    // Check crisis keywords first (fast, no API call needed)
    const contentLower = content.toLowerCase()
    const hasCrisisSignal = [
      ...CRISIS_KEYWORDS_ZH,
      ...CRISIS_KEYWORDS_EN
    ].some(kw => contentLower.includes(kw))

    // Claude safety scan
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Fast + cheap for safety scanning
      max_tokens: 100,
      system: `You are a content safety classifier for a pen-pal app.
Rate the following user message on a safety scale from 0.0 to 1.0:
- 1.0 = completely safe, warm, personal sharing
- 0.7 = borderline but acceptable (mild adult themes, some negativity)
- 0.4 = concerning (explicit content, hate speech, harassment)
- 0.0 = clearly harmful (CSAM, detailed self-harm instructions, targeted threats)

Respond with ONLY a JSON object: {"score": 0.0, "reason": "brief reason"}
Do not include any other text.`,
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    let score = 0.8 // Default to safe if parse fails
    try {
      const parsed = JSON.parse(text.trim())
      score = typeof parsed.score === 'number' ? parsed.score : 0.8
    } catch {
      // If Claude's response is unparseable, default to safe
      score = 0.8
    }

    return NextResponse.json({
      score,
      crisis: hasCrisisSignal,
    })

  } catch (error) {
    console.error('Safety scan error:', error)
    // On error, don't block content — log and allow
    return NextResponse.json({ score: 0.8, crisis: false })
  }
}
