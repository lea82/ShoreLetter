import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  // Save to waitlist table
  const { error: dbError } = await supabase
    .from('waitlist')
    .insert({ email })

  // If duplicate, still send confirmation (silent dedup)
  if (dbError && dbError.code !== '23505') {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  // Send confirmation email
  const { error: emailError } = await resend.emails.send({
    from:    'Shore Letter <onboarding@resend.dev>',
    to:      email,
    subject: '你的信，已经漂出去了',
    html: `
      <div style="max-width:480px; margin:0 auto; padding:48px 24px;
                  font-family:Georgia,serif; color:#1a2e3b;
                  background:#f5f0e8;">
        <p style="font-size:13px; letter-spacing:0.15em; text-transform:uppercase;
                  color:#4a8fa8; margin:0 0 32px;">
          岸信 · Shore Letter
        </p>
        <p style="font-size:18px; font-style:italic; line-height:1.8;
                  margin:0 0 24px;">
          你好，
        </p>
        <p style="font-size:15px; line-height:1.9; margin:0 0 16px;
                  color:#2c2c2c;">
          我们收到了你的邮箱。
        </p>
        <p style="font-size:15px; line-height:1.9; margin:0 0 32px;
                  color:#2c2c2c;">
          岸信还没有开放，但你的位置已经留好了。<br/>
          等潮水准备好，邀请会找到你。
        </p>
        <div style="height:1px; background:rgba(0,0,0,0.08); margin:0 0 32px;"></div>
        <p style="font-size:12px; color:#7a8a94; font-style:italic; margin:0;">
          — 岸信
        </p>
        <p style="font-size:11px; color:#7a8a94; margin:8px 0 0;
                  font-family:monospace; letter-spacing:0.1em;">
          shoreletter.app
        </p>
      </div>
    `,
  })

  if (emailError) {
    console.error('Email error:', emailError)
    // Don't fail the request if email fails — they're still on the waitlist
  }

  return NextResponse.json({ success: true })
}