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

    const { id, tags } = await req.json();
    
    if (!id) {
      return jsonResponse({ ok: false, error: 'Lead ID required' }, 400);
    }

    const supabase = sbSrv();

    const { error } = await supabase
      .from('leads')
      .update({ tags: tags || [] })
      .eq('id', id);

    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[admin-leads-assign] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
