import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { sbAnon } from '../_shared/utils.ts';
import { getLang } from '../_shared/i18n.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || getLang(req);
    const source_lang = url.searchParams.get('source') || 'en';

    const supabase = sbAnon(req);

    const { data, error } = await supabase
      .from('i18n_translations')
      .select('source_text,translated_text')
      .eq('source_lang', source_lang)
      .eq('target_lang', lang);

    if (error) throw error;

    const translations: Record<string, string> = {};
    for (const row of data || []) {
      translations[row.source_text] = row.translated_text;
    }

    return jsonResponse({ ok: true, lang, source_lang, translations });
  } catch (error) {
    console.error('[i18n-get] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
