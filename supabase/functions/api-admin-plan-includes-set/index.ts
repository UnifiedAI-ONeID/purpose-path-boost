import { corsHeaders } from '../_shared/admin-auth.ts';
import { json, readJson, sbSrv, bad } from '../_shared/utils.ts';
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

  const body = await readJson(req);
  const { plan_slug, package_ids } = body || {};

  if (!plan_slug || !Array.isArray(package_ids)) {
    return bad('Missing required fields: plan_slug, package_ids (array)');
  }

  const supabase = sbSrv();

  // Delete existing package mappings for this plan
  await supabase
    .from('plan_includes')
    .delete()
    .eq('plan_slug', plan_slug);

  // Insert new mappings
  if (package_ids.length > 0) {
    const rows = package_ids.map((id: string) => ({
      plan_slug,
      package_id: id
    }));

    const { error } = await supabase
      .from('plan_includes')
      .insert(rows);

    if (error) {
      console.error('[admin-plan-includes-set] Error:', error);
      return json({ ok: false, error: error.message }, 500);
    }
  }

  return json({ ok: true });
});
