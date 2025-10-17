import { json, readJson, bad, corsHeaders, sbSrv } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin } = await requireAdmin(req.headers.get('authorization'));
    if (!isAdmin) {
      return json({ ok: false, error: 'Admin access required' }, 403);
    }

    const { queue_id } = await readJson(req);
    if (!queue_id) {
      return bad('queue_id required');
    }

    const s = sbSrv();

    // Here you would call the actual platform APIs
    // For now, we mark as posted with timestamp
    const { error } = await s
      .from('social_queue')
      .update({
        status: 'posted',
        published_at: new Date().toISOString(),
        metrics: {}
      })
      .eq('id', queue_id);

    if (error) throw error;

    return json({ ok: true });
  } catch (error: any) {
    console.error('[api-admin-crosspost-publish] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
