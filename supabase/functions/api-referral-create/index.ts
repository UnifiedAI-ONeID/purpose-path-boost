import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/http.ts';

function generateCode(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return 'ZG-' + Array.from(bytes)
    .map(n => chars[n % chars.length])
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referrer_profile_id } = await req.json();
    
    // Validate UUID format
    if (!referrer_profile_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(referrer_profile_id)) {
      return errorResponse('Invalid referrer profile ID', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get referral settings
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('*')
      .single();

    const friendPercentOff = settings?.friend_percent_off ?? 20;
    const expiryDays = settings?.coupon_expiry_days ?? 7;

    // Create friend coupon
    const friendCoupon = generateCode(6);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 3600 * 1000);

    await supabase
      .from('coupons')
      .insert([{
        code: friendCoupon,
        percent_off: friendPercentOff,
        expires_at: expiresAt.toISOString(),
        applies_to: ['starter', 'growth', 'pro'],
        max_redemptions: 1
      }]);

    // Create referral
    const inviteCode = generateCode(4);
    await supabase
      .from('referrals')
      .insert([{
        code: inviteCode,
        referrer_profile_id,
        friend_coupon_code: friendCoupon
      }]);

    const baseUrl = Deno.env.get('VITE_SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || '';
    const referralLink = `${baseUrl}/invite?code=${inviteCode}`;

    return jsonResponse({
      ok: true,
      link: referralLink,
      code: inviteCode,
      friend_coupon: friendCoupon,
      expires_at: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('[api-referral-create] Error:', error);
    return errorResponse('Unable to create referral link', 500);
  }
});
