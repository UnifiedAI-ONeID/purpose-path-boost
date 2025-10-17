import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { sbAnon } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = sbAnon(req);

    const { data, error } = await supabase
      .from('experiments')
      .select('key,enabled,variants');

    if (error) throw error;

    const flags: Record<string, any> = {};
    (data || []).forEach((row: any) => {
      flags[row.key] = { enabled: row.enabled, variants: row.variants };
    });

    return jsonResponse({ ok: true, flags });
  } catch (error) {
    console.error('[flags-get] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
