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

    const body = await req.json();
    
    if (!body.slug || !body.title) {
      return jsonResponse({ ok: false, error: 'Slug and title required' }, 400);
    }

    const supabase = sbSrv();

    if (body.id) {
      const { error } = await supabase
        .from('events')
        .update(body)
        .eq('id', body.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('events')
        .insert([body]);
      
      if (error) throw error;
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[admin-events-upsert] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
