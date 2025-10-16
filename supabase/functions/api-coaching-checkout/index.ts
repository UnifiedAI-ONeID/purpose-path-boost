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
    const { slug, name, email, notes = '', currency = 'USD', coupon, promo } = await req.json();

    if (!slug || !name || !email) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get offer
    const { data: offer, error: offerError } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Offer not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get pricing with discount using edge function
    const priceResponse = await supabase.functions.invoke('api-coaching-price-with-discount', {
      body: { slug, currency, coupon, promo }
    });

    if (priceResponse.error || !priceResponse.data?.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Pricing error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const priceData = priceResponse.data;

    // If free (after discount), skip payment
    if (priceData.amount_cents <= 0 || offer.billing_type !== 'paid') {
      return new Response(
        JSON.stringify({ ok: true, free: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Note: Airwallex integration would go here
    // For now, return pending status
    return new Response(
      JSON.stringify({ 
        ok: true, 
        url: `/coaching/${slug}?payment=pending`,
        requires_payment: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
