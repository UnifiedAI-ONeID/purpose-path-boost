import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const HASH_SALT = Deno.env.get('METRICS_SALT') || 'change-me-in-production';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, dnt',
};

async function sha256hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Respect Do Not Track
  if (req.headers.get('dnt') === '1') {
    return new Response(JSON.stringify({ ok: true, tracked: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract client info
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const country = req.headers.get('cf-ipcountry') || null;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const events = Array.isArray(body.events) ? body.events.slice(0, 100) : [];

    if (events.length === 0) {
      return new Response(JSON.stringify({ ok: true, n: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hash IP for privacy
    const ipHash = (await sha256hex(ip + HASH_SALT)).slice(0, 16);

    // Prepare event rows
    const rows = events.map((e: any) => ({
      ts: new Date(e.ts || Date.now()).toISOString(),
      session_id: e.sessionId || crypto.randomUUID(),
      user_hash: ipHash,
      event: e.name || 'unknown',
      route: e.route || null,
      referrer: e.referrer || null,
      utm_source: e.utm?.utm_source || null,
      utm_medium: e.utm?.utm_medium || null,
      utm_campaign: e.utm?.utm_campaign || null,
      utm_content: e.utm?.utm_content || null,
      utm_term: e.utm?.utm_term || null,
      device: e.device || null,
      lang: e.lang || null,
      country,
      meta: e.payload || {},
    }));

    // Insert into database
    const { error } = await supabaseClient
      .from('events_raw')
      .insert(rows);

    if (error) {
      console.error('Failed to insert events:', error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true, n: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Metrics collection error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
