import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return jsonResponse({ ok: false, error: 'Slug is required' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return jsonResponse({ ok: false, error: 'Event not found' }, 200);
    }

    return jsonResponse(data, 200);
  } catch (e: any) {
    console.error('[api-events-get] Error:', e);
    return jsonResponse({ ok: false, error: e.message || 'Unknown error' }, 200);
  }
});
