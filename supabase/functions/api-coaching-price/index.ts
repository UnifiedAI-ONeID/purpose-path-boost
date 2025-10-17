import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, currency = 'USD' } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    if (!slug) {
      return jsonResponse({ ok: false, error: 'Missing slug parameter' }, 200);
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
      .maybeSingle();

    if (offerError || !offer) {
      return jsonResponse({ ok: false, error: 'Coaching offer not found' }, 200);
    }

    // Check for price override
    const { data: override } = await supabase
      .from('coaching_price_overrides')
      .select('*')
      .eq('offer_slug', slug)
      .eq('currency', currency)
      .maybeSingle();

    const priceCents = override?.price_cents || offer.base_price_cents || 0;

    return jsonResponse({ 
      ok: true, 
      currency, 
      amount_cents: priceCents,
      base_currency: offer.base_currency,
      base_price_cents: offer.base_price_cents
    }, 200);
  } catch (error) {
    console.error('[api-coaching-price] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
