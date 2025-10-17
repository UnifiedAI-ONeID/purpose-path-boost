import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const { profile_id, plan_slug, interval = 'month', coupon } = await req.json();

    // Validate UUID
    if (!profile_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile_id)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid profile ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate plan slug
    if (!plan_slug || typeof plan_slug !== 'string' || plan_slug.length > 50) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid plan slug' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate interval
    if (!['month', 'year'].includes(interval)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid interval' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate coupon if provided
    if (coupon && (typeof coupon !== 'string' || coupon.length > 50)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid coupon code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate plan
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('active', true)
      .maybeSingle();

    if (!plan) {
      return new Response(
        JSON.stringify({ ok: false, error: 'plan not found or inactive' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Calculate price with coupon
    let price_cents = interval === 'month' ? plan.monthly_usd_cents : plan.annual_usd_cents;
    let percent_off = 0;

    if (coupon) {
      const { data: couponData } = await supabase
        .from('subscription_coupons')
        .select('*')
        .eq('code', coupon)
        .eq('active', true)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (couponData?.percent_off && (!couponData.applies_to?.length || couponData.applies_to.includes(plan_slug))) {
        percent_off = couponData.percent_off;
        price_cents = Math.round(price_cents * (1 - percent_off / 100));
      }
    }

    // Get profile info
    const { data: profile } = await supabase
      .from('zg_profiles')
      .select('email, name, locale')
      .eq('id', profile_id)
      .maybeSingle();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: 'profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Mock response for development (Airwallex integration would go here)
    const origin = req.headers.get('origin') || 'https://zhengrowth.com';
    const redirect_url = `${origin}/pricing/success?plan=${plan_slug}&interval=${interval}`;

    return new Response(
      JSON.stringify({
        ok: true,
        redirect_url,
        agreement_id: `agr_${crypto.randomUUID()}`,
        amount_cents: price_cents,
        currency: 'USD',
        interval
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create agreement error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Unable to create billing agreement' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
