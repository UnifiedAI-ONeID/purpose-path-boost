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

    const body = await readJson(req);
    const { code, name, percent_off, valid_from, valid_to, max_redemptions, applies_to_slug, notes, active } = body;

    if (!code) {
      return bad('Code is required');
    }

    const s = sbSrv();
    
    const couponData: any = {
      code: code.toUpperCase(),
      percent_off: percent_off ? Number(percent_off) : null,
      active: active !== undefined ? active : true
    };

    if (name !== undefined) couponData.name = name;
    if (valid_from !== undefined) couponData.valid_from = valid_from;
    if (valid_to !== undefined) couponData.valid_to = valid_to;
    if (max_redemptions !== undefined) couponData.max_redemptions = max_redemptions ? Number(max_redemptions) : null;
    if (applies_to_slug !== undefined) couponData.applies_to_slug = applies_to_slug;
    if (notes !== undefined) couponData.notes = notes;

    const { error } = await s.from('coupons').upsert(couponData, { onConflict: 'code' });

    if (error) throw error;

    return json({ ok: true });
  } catch (error: any) {
    console.error('[api-admin-coupons-save] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});