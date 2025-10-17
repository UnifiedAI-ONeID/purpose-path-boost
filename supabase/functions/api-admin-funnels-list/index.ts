import { corsHeaders } from '../_shared/admin-auth.ts';
import { json, sbSrv } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  const { isAdmin } = await requireAdmin(authHeader);
  
  if (!isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  const supabase = sbSrv();
  const { data, error } = await supabase
    .from('funnels')
    .select('*')
    .order('name');

  if (error) {
    console.error('[admin-funnels-list] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, rows: data || [] });
});
