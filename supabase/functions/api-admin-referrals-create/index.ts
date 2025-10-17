import { json, readJson, bad, corsHeaders, sbSrv } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

function generateCode(len = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return 'ZG-' + Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin } = await requireAdmin(req.headers.get('authorization'));
    if (!isAdmin) {
      return json({ ok: false, error: 'Admin access required' }, 403);
    }

    const { email } = await readJson(req);
    if (!email) {
      return bad('EMAIL_REQUIRED');
    }

    const s = sbSrv();

    // Find profile by email
    const { data: profile, error: profileError } = await s
      .from('zg_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return json({ ok: false, error: 'Profile not found' }, 404);
    }

    // Get referral settings
    const { data: settings } = await s
      .from('referral_settings')
      .select('*')
      .single();

    const friendPercent = settings?.friend_percent_off || 20;
    const days = settings?.coupon_expiry_days || 7;

    // Create friend coupon
    const friendCoupon = generateCode(6);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    await s.from('coupons').insert([{
      code: friendCoupon,
      percent_off: friendPercent,
      valid_to: expiresAt,
      max_redemptions: 1,
      applies_to_slug: 'all',
      name: `Friend referral for ${email}`
    }]);

    // Create referral invite
    const inviteCode = generateCode(4);
    const baseUrl = Deno.env.get('PUBLIC_BASE_URL') || 'https://zhengrowth.com';

    await s.from('zg_referrals').insert([{
      referrer_profile_id: profile.id,
      ref_code: inviteCode,
      status: 'active'
    }]);

    return json({
      ok: true,
      link: `${baseUrl}/?ref=${inviteCode}`,
      invite: inviteCode,
      friend_coupon: friendCoupon,
      expires_at: expiresAt
    });
  } catch (error: any) {
    console.error('[api-admin-referrals-create] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
