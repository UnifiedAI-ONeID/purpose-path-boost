import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, currency = 'USD', coupon, promo } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    if (!slug) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing slug parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get coaching offer
    const { data: offer, error: offerError } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Coaching offer not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check for price override
    const { data: override } = await supabase
      .from('coaching_price_overrides')
      .select('*')
      .eq('offer_slug', slug)
      .eq('currency', currency)
      .maybeSingle();

    let priceCents = override?.price_cents || offer.base_price_cents || 0;
    let discountCents = 0;

    // Apply coupon if provided
    if (coupon) {
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon)
        .eq('active', true)
        .maybeSingle();

      if (couponData && couponData.percent_off) {
        discountCents = Math.round(priceCents * (couponData.percent_off / 100));
        priceCents -= discountCents;
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        currency, 
        amount_cents: priceCents,
        discount_cents: discountCents,
        base_currency: offer.base_currency,
        base_price_cents: offer.base_price_cents
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Coaching price with discount error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
