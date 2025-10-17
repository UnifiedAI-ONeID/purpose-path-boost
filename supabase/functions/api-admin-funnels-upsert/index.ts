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
  const {
    id,
    slug,
    name,
    target_plan_slug,
    config = {}
  } = body || {};

  if (!slug || !name) {
    return bad('Missing required fields: slug, name');
  }

  const supabase = sbSrv();

  if (id) {
    // Update existing funnel
    const { error } = await supabase
      .from('funnels')
      .update({ slug, name, target_plan_slug, config })
      .eq('id', id);

    if (error) {
      console.error('[admin-funnels-upsert] Update error:', error);
      return json({ ok: false, error: error.message }, 500);
    }
  } else {
    // Insert new funnel
    const { error } = await supabase
      .from('funnels')
      .insert([{ slug, name, target_plan_slug, config }]);

    if (error) {
      console.error('[admin-funnels-upsert] Insert error:', error);
      return json({ ok: false, error: error.message }, 500);
    }
  }

  return json({ ok: true });
});
