import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';
import { jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin } = await requireAdmin(req.headers.get('authorization'));
    
    if (!isAdmin) {
      return jsonResponse({ ok: false, error: 'Admin access required', rows: [] }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase
      .from('coaching_offers')
      .select('*')
      .order('sort', { ascending: true });

    if (error) {
      console.error('[api-admin-coaching-list] Query error:', error);
      return jsonResponse({ ok: false, error: error.message, rows: [] }, 200);
    }

    return jsonResponse({ ok: true, rows: data || [] }, 200);
  } catch (error) {
    console.error('[api-admin-coaching-list] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message, rows: [] }, 200);
  }
});
