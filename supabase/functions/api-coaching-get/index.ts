import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support both POST and GET requests
    const params = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);
    
    const slug = params.slug;
    const locale = params.locale || 'en';

    if (!slug) {
      return jsonResponse({ ok: false, error: 'Missing slug parameter' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return jsonResponse({ ok: false, error: 'Coaching program not found' }, 200);
    }

    // Filter by locale if needed
    if (data.locale && data.locale !== locale) {
      return jsonResponse({ ok: false, error: 'Not available in this language' }, 200);
    }

    return jsonResponse({ ok: true, ...data }, 200);
  } catch (error) {
    console.error('[api-coaching-get] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
