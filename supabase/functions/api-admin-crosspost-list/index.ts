import { json, sbSrv, corsHeaders } from '../_shared/utils.ts';
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

    const s = sbSrv();
    const { data: rows, error } = await s
      .from('social_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return json({ ok: true, rows: rows || [] });
  } catch (error: any) {
    console.error('[api-admin-crosspost-list] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
