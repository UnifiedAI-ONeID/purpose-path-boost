import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return errorResponse('Missing code parameter', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get referral
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (!referral) {
      return jsonResponse({ ok: false, error: 'Referral not found' }, 404);
    }

    // Get settings
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('*')
      .single();

    // Get coupon expiry
    const { data: coupon } = await supabase
      .from('coupons')
      .select('expires_at')
      .eq('code', referral.friend_coupon_code)
      .maybeSingle();

    return jsonResponse({
      ok: true,
      friend_coupon: referral.friend_coupon_code,
      friend_percent_off: settings?.friend_percent_off ?? 20,
      expires_at: coupon?.expires_at
    });

  } catch (error) {
    console.error('[api-referral-info] Error:', error);
    return errorResponse('Internal server error', 500);
  }
});
