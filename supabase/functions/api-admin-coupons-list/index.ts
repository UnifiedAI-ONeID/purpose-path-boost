import { json, sbSrv, corsHeaders, qs } from '../_shared/utils.ts';
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

    const params = qs(req);
    const tab = params.get('tab') || 'active';
    const search = params.get('q') || '';

    const s = sbSrv();
    let query = s.from('coupons').select('*');

    // Filter by status
    if (tab === 'active') {
      query = query.eq('active', true)
        .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString()}`)
        .or(`valid_from.is.null,valid_from.lte.${new Date().toISOString()}`);
    } else if (tab === 'scheduled') {
      query = query.gt('valid_from', new Date().toISOString());
    } else if (tab === 'expired') {
      query = query.or(`valid_to.lt.${new Date().toISOString()},active.eq.false`);
    }

    // Search filter
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data: rows, error } = await query.order('created_at', { ascending: false }).limit(200);

    if (error) throw error;

    return json({ ok: true, rows: rows || [] });
  } catch (error: any) {
    console.error('[api-admin-coupons-list] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
