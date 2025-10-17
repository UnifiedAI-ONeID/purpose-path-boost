import { json, readJson, corsHeaders } from '../_shared/utils.ts';
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

    const { base_cents, percent_off = 0 } = await readJson(req);

    if (!base_cents || typeof base_cents !== 'number') {
      return json({ ok: false, error: 'base_cents required' }, 400);
    }

    const discounted_cents = Math.max(0, Math.round(base_cents * (1 - percent_off / 100)));

    return json({ 
      ok: true, 
      base_cents, 
      percent_off, 
      discounted_cents 
    });
  } catch (error: any) {
    console.error('[api-admin-coupons-simulate] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
