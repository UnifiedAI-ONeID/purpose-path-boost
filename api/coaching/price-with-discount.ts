import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { applyDiscount } from '../_util/discount';

function psychRound(currency: string, cents: number) {
  const v = Math.max(0, cents);
  const r = Math.round(v / 100) * 100;
  return r > 0 ? r - 1 : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
    );

    const { slug, currency = 'USD', coupon, promo } = 
      (req.method === 'POST' ? req.body : req.query) as any;

    if (!slug) {
      return res.status(400).json({ ok: false, error: 'missing slug' });
    }

    const targetCurrency = (currency || 'USD').toUpperCase();

    // Get offer
    const { data: offer } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!offer) {
      return res.status(404).json({ ok: false, error: 'offer not found' });
    }

    if (offer.billing_type !== 'paid') {
      return res.status(200).json({
        ok: true,
        currency: targetCurrency,
        base_cents: 0,
        amount_cents: 0,
        discount_cents: 0,
        applied: null
      });
    }

    // Resolve base price in target currency
    const { data: override } = await supabase
      .from('coaching_price_overrides')
      .select('*')
      .eq('offer_slug', slug)
      .eq('currency', targetCurrency)
      .maybeSingle();

    let baseCents: number;

    if (override) {
      baseCents = override.price_cents;
    } else if (targetCurrency === offer.base_currency) {
      baseCents = offer.base_price_cents;
    } else {
      // Convert using FX rates
      const { data: fxData } = await supabase
        .from('fx_rates')
        .select('*')
        .eq('base', offer.base_currency)
        .maybeSingle();

      const rate = fxData?.rates?.[targetCurrency];
      
      if (!rate) {
        // Fallback to base currency
        baseCents = psychRound(offer.base_currency, offer.base_price_cents);
        return res.status(200).json({
          ok: true,
          currency: offer.base_currency,
          base_cents: baseCents,
          amount_cents: baseCents,
          discount_cents: 0,
          applied: null
        });
      }

      baseCents = Math.round(offer.base_price_cents * rate);
    }

    baseCents = psychRound(targetCurrency, baseCents);

    // Load coupon if provided
    let couponRow: any = null;
    if (coupon) {
      const code = String(coupon).trim().toUpperCase();
      const now = new Date().toISOString();
      
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .lte('valid_from', now)
        .gte('valid_to', now)
        .maybeSingle();

      if (couponData) {
        if (!couponData.applies_to_slug || couponData.applies_to_slug === slug) {
          couponRow = couponData;
        }
      }
    }

    // Load promotion if provided
    let promoRow: any = null;
    if (promo) {
      const key = String(promo).trim().toUpperCase();
      const now = new Date().toISOString();
      
      const { data: promoData } = await supabase
        .from('promotions')
        .select('*')
        .eq('key', key)
        .eq('active', true)
        .lte('valid_from', now)
        .gte('valid_to', now)
        .maybeSingle();

      if (promoData && (!promoData.applies_to_slug || promoData.applies_to_slug === slug)) {
        promoRow = promoData;
      }
    }

    // Calculate discounts and pick the best one
    const options = [
      { type: 'none', amount: baseCents, percent_off: 0, amount_off_cents: 0 }
    ];

    if (couponRow) {
      const discountedAmount = applyDiscount({
        baseCents,
        currency: targetCurrency,
        percent_off: couponRow.percent_off,
        amount_off_cents: couponRow.currency && couponRow.currency !== targetCurrency 
          ? 0 
          : couponRow.amount_off_cents
      });
      options.push({
        type: 'coupon',
        amount: discountedAmount,
        percent_off: couponRow.percent_off || 0,
        amount_off_cents: couponRow.amount_off_cents || 0
      });
    }

    if (promoRow) {
      const discountedAmount = applyDiscount({
        baseCents,
        currency: targetCurrency,
        percent_off: promoRow.percent_off,
        amount_off_cents: promoRow.currency && promoRow.currency !== targetCurrency 
          ? 0 
          : promoRow.amount_off_cents
      });
      options.push({
        type: 'promo',
        amount: discountedAmount,
        percent_off: promoRow.percent_off || 0,
        amount_off_cents: promoRow.amount_off_cents || 0
      });
    }

    // Sort by lowest price
    const best = options.sort((a, b) => a.amount - b.amount)[0];
    const discount_cents = Math.max(0, baseCents - best.amount);

    return res.status(200).json({
      ok: true,
      currency: targetCurrency,
      base_cents: baseCents,
      amount_cents: best.amount,
      discount_cents,
      applied: best.type === 'none' ? null : {
        type: best.type,
        percent_off: best.percent_off,
        amount_off_cents: best.amount_off_cents
      }
    });
  } catch (error: any) {
    console.error('Pricing error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
