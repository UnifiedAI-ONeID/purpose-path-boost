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
    const { slug, name, email, notes = '', currency = 'USD', coupon, promo } = await req.json();

    if (!slug || !name || !email) {
      return jsonResponse({ ok: false, error: 'Missing required fields' }, 200);
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
      .maybeSingle();

    if (offerError || !offer) {
      return jsonResponse({ ok: false, error: 'Offer not found' }, 200);
    }

    // Get pricing with discount using edge function
    const priceResponse = await supabase.functions.invoke('api-coaching-price-with-discount', {
      body: { slug, currency, coupon, promo }
    });

    if (priceResponse.error || !priceResponse.data?.ok) {
      return jsonResponse({ ok: false, error: 'Pricing error' }, 200);
    }

    const priceData = priceResponse.data;

    // If free (after discount), skip payment
    if (priceData.amount_cents <= 0 || offer.billing_type !== 'paid') {
      return jsonResponse({ ok: true, free: true }, 200);
    }

    // Note: Airwallex integration would go here
    // For now, return pending status
    return jsonResponse({ 
      ok: true, 
      url: `/coaching/${slug}?payment=pending`,
      requires_payment: true
    }, 200);
  } catch (error: any) {
    console.error('[api-coaching-checkout] Error:', error);
    return jsonResponse({ ok: false, error: error.message }, 200);
  }
});
