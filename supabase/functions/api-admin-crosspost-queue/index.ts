import { json, readJson, bad, corsHeaders, sbSrv } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin, user } = await requireAdmin(req.headers.get('authorization'));
    if (!isAdmin || !user) {
      return json({ ok: false, error: 'Admin access required' }, 403);
    }

    const { items } = await readJson(req);

    if (!Array.isArray(items) || items.length === 0) {
      return bad('items array required');
    }

    const s = sbSrv();
    
    // Prepare payload with created_by
    const payload = items.map((x: any) => ({
      ...x,
      status: x.scheduled_at ? 'queued' : 'draft',
      created_by: user.id
    }));

    const { data, error } = await s
      .from('social_queue')
      .insert(payload)
      .select('id, platform, status, scheduled_at');

    if (error) throw error;

    return json({ ok: true, rows: data || [] });
  } catch (error: any) {
    console.error('[api-admin-crosspost-queue] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
