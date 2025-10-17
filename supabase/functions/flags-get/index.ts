import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase
      .from('remote_flags')
      .select('key, value');

    if (error) throw error;

    const flags: Record<string, any> = {};
    (data || []).forEach((row: any) => {
      flags[row.key] = row.value;
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
