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
    const { currency = 'USD', offer_slug = 'priority-30' } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get express offer
    const { data: offer, error: offerError } = await supabase
      .from('express_offers')
      .select('*')
      .eq('slug', offer_slug)
      .maybeSingle();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Offer not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check for price override
    const { data: override } = await supabase
      .from('express_price_overrides')
      .select('*')
      .eq('offer_slug', offer_slug)
      .eq('currency', currency)
      .maybeSingle();

    const priceCents = override?.price_cents || offer.base_price_cents || 9900;

    return new Response(
      JSON.stringify({ 
        ok: true, 
        currency, 
        amount_cents: priceCents
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Express price error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
