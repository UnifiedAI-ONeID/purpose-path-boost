import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { sbSrv } from '../_shared/utils.ts';

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
    const source = url.searchParams.get('source');
    const limit = parseInt(url.searchParams.get('limit') || '200');

    const supabase = sbSrv();

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (stage) query = query.eq('stage', stage);
    if (source) query = query.eq('source', source);

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
