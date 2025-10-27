import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function ensureFreshToken(supabase: any, tok: any) {
  const expiresSoon = new Date(tok.expiry).getTime() - Date.now() < 60_000
  if (!expiresSoon) return tok

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tok.refresh_token,
    grant_type: 'refresh_token',
  })

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  const data = await resp.json()
  const fresh = {
    ...tok,
    access_token: data.access_token,
    expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }

  await supabase.from('oauth_tokens').insert({
    provider: 'google',
    account_email: tok.account_email,
    access_token: fresh.access_token,
    refresh_token: fresh.refresh_token,
    expiry: fresh.expiry,
  })

  return fresh
}

async function sendEmailWithAttachment(args: {
  access_token: string
  to: string
  subject: string
  html: string
  attachmentUrl?: string | null
}) {
  const fromName = Deno.env.get('OUTREACH_FROM_NAME') || 'Immigration Team'
  const fromEmail = Deno.env.get('OUTREACH_FROM_EMAIL') || 'noreply@example.com'

  let raw =
    `From: "${fromName}" <${fromEmail}>\n` +
    `To: ${args.to}\n` +
    `Subject: ${args.subject}\n` +
    `MIME-Version: 1.0\n`

  if (args.attachmentUrl) {
    const fileRes = await fetch(args.attachmentUrl)
    const buf = new Uint8Array(await fileRes.arrayBuffer())
    const b64 = btoa(String.fromCharCode(...buf))

    raw +=
      `Content-Type: multipart/mixed; boundary="boundary"\n\n` +
      `--boundary\n` +
      `Content-Type: text/html; charset="UTF-8"\n\n` +
      `${args.html}\n\n` +
      `--boundary\n` +
      `Content-Type: application/pdf\n` +
      `Content-Transfer-Encoding: base64\n` +
      `Content-Disposition: attachment; filename="info.pdf"\n\n` +
      `${b64}\n` +
      `--boundary--`
  } else {
    raw += `Content-Type: text/html; charset="UTF-8"\n\n` + args.html
  }

  const encoded = btoa(raw)

  await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  })
}

async function proposeCalendar(access_token: string, to: string) {
  const start = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 20 * 60 * 1000)

  await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: 'Canadian Immigration Consultation (Free - 20 min)',
      description:
        'Initial consultation regarding Canadian immigration goals. This conversation is intake only and not legal advice.',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: to }],
    }),
  })
}

function renderEmailHTML(tpl: string, lead: any) {
  const bookingUrl = Deno.env.get('BOOKING_URL') || 'https://cal.com/yourhandle'
  const name = lead.name || lead.full_name || 'client'

  switch (tpl) {
    case 'welcome':
      return `
      <p>Dear ${name},</p>
      <p>Thank you for contacting Amelda & Mayshahid Associates Co.</p>
      <p>We are reviewing your situation. A licensed Canadian immigration professional will reach out with next steps.</p>
      <p>You can also pick a time here right now:<br/>
      <a href="${bookingUrl}">Book your free 20-minute consultation</a></p>
      <p>This email is intake only and not legal advice.</p>`
    case 'welcome_checklist':
      return `
      <p>Dear ${name},</p>
      <p>As requested, attached is a short preparation checklist for your pathway.</p>
      <p>We will contact you within 1 business day to propose a free 20-minute consultation with a licensed Canadian immigration professional.</p>
      <p>This email is intake only and not legal advice.</p>`
    case 'check_in_no_checklist':
      return `
      <p>Dear ${name},</p>
      <p>Thank you again for reaching out. We are preparing next steps and will contact you shortly.</p>
      <p>You can reserve time here:<br/>
      <a href="${bookingUrl}">Book your free 20-minute consultation</a></p>
      <p>This message is intake only and not legal advice.</p>`
    case 'nudge':
    default:
      return `
      <p>Hi ${name},</p>
      <p>We're here when you're ready to move forward toward Canada. If this is still a priority, you can confirm a time now:</p>
      <p><a href="${bookingUrl}">Book your consultation</a></p>
      <p>If it's not the right time, just reply NO and we'll pause follow-up.</p>
      <p>This message is intake only and not legal advice.</p>`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const nowIso = new Date().toISOString()
    const { data: queue, error } = await supabase
      .from('email_sequences')
      .select('*, leads(*)')
      .lte('scheduled_at', nowIso)
      .is('sent_at', null)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!queue?.length) {
      return new Response(
        JSON.stringify({ message: 'No emails due' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: tokData } = await supabase
      .from('oauth_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    let tok = tokData?.[0]
    if (!tok) {
      return new Response(
        JSON.stringify({ error: 'Google OAuth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    tok = await ensureFreshToken(supabase, tok)

    for (const item of queue) {
      const lead = item.leads
      const to = lead.email

      let attachmentUrl: string | null = null
      if (item.template_key === 'welcome_checklist') {
        const { data: assetData } = await supabase
          .from('email_assets')
          .select('public_url')
          .eq('purpose', 'welcome_checklist')
          .eq('pathway', item.pathway || lead.pathway || 'general')
          .eq('locale', item.locale || lead.locale || 'en')
          .limit(1)
        attachmentUrl = assetData?.[0]?.public_url || null
      }

      const html = renderEmailHTML(item.template_key, lead)

      await sendEmailWithAttachment({
        access_token: tok.access_token,
        to,
        subject: 'Your next step to Canada',
        html,
        attachmentUrl,
      })

      if (item.step === 0) {
        await proposeCalendar(tok.access_token, to)
      }

      await supabase
        .from('email_sequences')
        .update({
          sent_at: new Date().toISOString(),
          status: 'sent',
        })
        .eq('id', item.id)
    }

    return new Response(
      JSON.stringify({ message: `Sent ${queue.length} emails` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
