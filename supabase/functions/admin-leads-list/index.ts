import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);
    
    if (!isAdmin) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const url = new URL(req.url);
    const stage = url.searchParams.get('stage');
    const owner = url.searchParams.get('owner');
    const limit = parseInt(url.searchParams.get('limit') || '200');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let query = supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (stage) query = query.eq('stage', stage);
    if (owner) query = query.eq('owner', owner);

    const { data, error } = await query;

    if (error) throw error;

    return jsonResponse({ ok: true, rows: data || [] });
  } catch (error) {
    console.error('[admin-leads-list] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
