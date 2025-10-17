import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, name, email, campaign } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    const team = Deno.env.get('CALCOM_TEAM') || 'zhengrowth';

    if (!slug) {
      return jsonResponse({ ok: false, error: 'Missing slug parameter' }, 200);
    }

    const params = new URLSearchParams({
      name: name || '',
      email: email || '',
      utm_source: 'zg',
      utm_medium: 'cta',
      utm_campaign: campaign || 'site'
    });

    const url = `https://cal.com/${team}/${slug}?${params.toString()}`;

    return jsonResponse({ ok: true, url }, 200);
  } catch (error) {
    console.error('[api-cal-book-url] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
