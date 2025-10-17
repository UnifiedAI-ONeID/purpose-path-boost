import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { sbSrv } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);
    
    if (!isAdmin) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const { source_lang, target_lang, source_text, translated_text, scope } = await req.json();
    
    if (!source_lang || !target_lang || !source_text || !translated_text) {
      return jsonResponse({ 
        ok: false, 
        error: 'Source lang, target lang, source text and translated text required' 
      }, 400);
    }

    const supabase = sbSrv();

    const { error } = await supabase
      .from('i18n_translations')
      .upsert({ 
        source_lang, 
        target_lang, 
        source_text, 
        translated_text, 
        scope: scope || 'general',
        source_hash: `${source_lang}_${target_lang}_${source_text}`.substring(0, 255)
      });

    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[admin-i18n-upsert] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
