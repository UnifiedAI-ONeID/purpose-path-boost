import { json, readJson, corsHeaders, sbSrv } from '../_shared/utils.ts';
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

    const { friend_percent_off, referrer_percent_off, coupon_expiry_days } = await readJson(req);

    const s = sbSrv();
    const { error } = await s
      .from('referral_settings')
      .upsert({ 
        id: true, 
        friend_percent_off, 
        referrer_percent_off, 
        coupon_expiry_days 
      });

    if (error) throw error;

    return json({ ok: true });
  } catch (error: any) {
    console.error('[api-admin-referrals-settings] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
