import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'en';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase
      .from('i18n_dict')
      .select('ns, key, value')
      .eq('lang', lang);

    if (error) throw error;

    const pack: Record<string, Record<string, string>> = {};
    
    for (const row of data || []) {
      if (!pack[row.ns]) {
        pack[row.ns] = {};
      }
      pack[row.ns][row.key] = row.value;
    }

    return jsonResponse({ ok: true, lang, pack });
  } catch (error) {
    console.error('[i18n-get] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
