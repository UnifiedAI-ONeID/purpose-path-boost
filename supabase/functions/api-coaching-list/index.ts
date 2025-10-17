import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') || 'en';

    const { data, error } = await supabase
      .from('coaching_offers')
      .select('*')
      .order('sort', { ascending: true });

    if (error) {
      console.error('[api-coaching-list] Error:', error);
      return jsonResponse({ ok: false, error: error.message, rows: [] }, 200);
    }

    // Filter by locale if available
    const filtered = locale ? data?.filter(item => !item.locale || item.locale === locale) : data;

    return jsonResponse({ ok: true, rows: filtered || [] }, 200);
  } catch (error) {
    console.error('[api-coaching-list] Handler error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message, rows: [] }, 200);
  }
});
