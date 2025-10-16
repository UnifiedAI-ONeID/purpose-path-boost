import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Import pricing helpers from events
function applyBuffer(cents: number, bufferBps: number): number {
  return Math.round(cents * (1 + bufferBps / 10000));
}

function psychRound(currency: string, cents: number, settings: any): number {
  if (currency === 'CNY') {
    const roundingMode = settings?.cny_rounding || 'yuan';
    if (roundingMode === 'yuan') {
      return Math.round(cents / 100) * 100;
    }
  }
  
  // Round to nearest dollar for most currencies
  if (['USD', 'CAD', 'EUR', 'GBP', 'SGD', 'HKD'].includes(currency)) {
    return Math.round(cents / 100) * 100;
  }
  
  return cents;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { slug, currency = 'USD' } = req.method === 'POST' ? req.body : req.query;
    
    if (!slug) {
      return res.status(400).json({ ok: false, error: 'Missing slug parameter' });
    }

    const targetCurrency = (currency || 'USD').toUpperCase();

    // Get pricing settings
    const { data: settings } = await supabase
      .from('pricing_settings')
      .select('*')
      .single();

    const supportedCurrencies = settings?.supported || ['USD'];
    const finalCurrency = supportedCurrencies.includes(targetCurrency) 
      ? targetCurrency 
      : supportedCurrencies[0];

    // Get offer
    const { data: offer, error: offerError } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (offerError || !offer) {
      return res.status(404).json({ ok: false, error: 'Offer not found' });
    }

    // Free offer
    if (offer.billing_type !== 'paid') {
      return res.status(200).json({ 
        ok: true, 
        currency: finalCurrency, 
        amount_cents: 0 
      });
    }

    // Check for currency override
    const { data: override } = await supabase
      .from('coaching_price_overrides')
      .select('*')
      .eq('offer_slug', slug)
      .eq('currency', finalCurrency)
      .maybeSingle();

    if (override) {
      return res.status(200).json({ 
        ok: true, 
        currency: finalCurrency, 
        amount_cents: override.price_cents 
      });
    }

    // Same currency as base
    if (finalCurrency === offer.base_currency) {
      const cents = psychRound(finalCurrency, offer.base_price_cents, settings);
      return res.status(200).json({ 
        ok: true, 
        currency: finalCurrency, 
        amount_cents: cents 
      });
    }

    // Convert using FX rates
    const { data: fxData } = await supabase
      .from('fx_rates')
      .select('*')
      .eq('base', offer.base_currency)
      .maybeSingle();

    const rate = fxData?.rates?.[finalCurrency];
    
    if (!rate) {
      // Fallback to base currency
      const cents = psychRound(offer.base_currency, offer.base_price_cents, settings);
      return res.status(200).json({ 
        ok: true, 
        currency: offer.base_currency, 
        amount_cents: cents 
      });
    }

    const rawConverted = Math.round(offer.base_price_cents * rate);
    const withBuffer = applyBuffer(rawConverted, settings?.buffer_bps ?? 150);
    const finalCents = psychRound(finalCurrency, withBuffer, settings);

    return res.status(200).json({ 
      ok: true, 
      currency: finalCurrency, 
      amount_cents: finalCents 
    });
  } catch (error: any) {
    console.error('Pricing error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
