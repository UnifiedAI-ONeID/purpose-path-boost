import { corsHeaders } from '../_shared/admin-auth.ts';
import { json, readJson, sbSrv } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(null, { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  const { isAdmin } = await requireAdmin(authHeader);
  
  if (!isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  const { slug } = await readJson(req);
  
  if (!slug) {
    return json({ ok: false, error: 'Missing slug' }, 400);
  }

  const supabase = sbSrv();
  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('slug', slug);

  if (error) {
    console.error('[admin-plans-delete] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true });
});
