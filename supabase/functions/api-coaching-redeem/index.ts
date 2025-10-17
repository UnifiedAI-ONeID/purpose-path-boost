import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 200);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { slug, email, coupon, amount_cents } = await req.json();

    if (!slug || !email || !coupon) {
      return jsonResponse({ ok: false, error: 'Missing required fields' }, 200);
    }

    const code = String(coupon).toUpperCase();

    // Get coupon details
    const { data: couponData } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (!couponData) {
      return jsonResponse({ ok: false, error: 'Coupon not found' }, 200);
    }

    // Check per-user limit
    if (couponData.per_user_limit) {
      const { count } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_code', code)
        .eq('email', email);

      if ((count || 0) >= couponData.per_user_limit) {
        return jsonResponse({ ok: false, error: 'Coupon per-user limit reached' }, 200);
      }
    }

    // Check max redemptions
    if (couponData.max_redemptions) {
      const { count } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_code', code);

      if ((count || 0) >= couponData.max_redemptions) {
        return jsonResponse({ ok: false, error: 'Coupon fully redeemed' }, 200);
      }
    }

    // Record redemption
    const { error } = await supabase
      .from('coupon_redemptions')
      .insert([{
        coupon_code: code,
        offer_slug: slug,
        email,
        amount_cents: amount_cents ?? 0
      }]);

    if (error) {
      console.error('[api-coaching-redeem] Redemption error:', error);
      return jsonResponse({ ok: false, error: error.message }, 200);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error: any) {
    console.error('[api-coaching-redeem] Error:', error);
    return jsonResponse({ ok: false, error: error.message }, 200);
  }
});
