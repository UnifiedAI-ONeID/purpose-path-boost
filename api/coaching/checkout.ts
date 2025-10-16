import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getLang } from '../_util/i18n';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { slug, name, email, notes = '', currency = 'USD', coupon, promo } = req.body || {};

    if (!slug || !name || !email) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const lang = getLang(req);

    // Get offer
    const { data: offer, error: offerError } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (offerError || !offer) {
      return res.status(400).json({ ok: false, error: 'Offer not found' });
    }

    // Get pricing with discount
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = req.headers.host as string;
    const baseUrl = `${protocol}://${host}`;

    const priceResponse = await fetch(`${baseUrl}/api/coaching/price-with-discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, currency, coupon, promo })
    });

    const priceData = await priceResponse.json();

    if (!priceData?.ok) {
      return res.status(400).json({ ok: false, error: 'Pricing error' });
    }

    // If free (after discount), skip payment
    if (priceData.amount_cents <= 0 || offer.billing_type !== 'paid') {
      return res.status(200).json({ ok: true, free: true });
    }

    // Create Airwallex payment intent
    const airwallexToken = process.env.AIRWALLEX_API_KEY;
    
    if (!airwallexToken) {
      return res.status(500).json({ ok: false, error: 'Payment gateway not configured' });
    }

    const merchantOrderId = `COACH-${slug}-${Date.now()}`;

    const paymentIntent = await fetch('https://api.airwallex.com/api/v1/pa/payment_intents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airwallexToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request_id: crypto.randomUUID(),
        amount: priceData.amount_cents / 100,
        currency: priceData.currency,
        merchant_order_id: merchantOrderId,
        return_url: `${baseUrl}/coaching/${slug}?paid=1&lang=${encodeURIComponent(lang)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&coupon=${encodeURIComponent(coupon || '')}&promo=${encodeURIComponent(promo || '')}`,
        cancel_url: `${baseUrl}/coaching/${slug}?cancel=1`,
        descriptor: `ZhenGrowth ${offer.title_en || slug}`
      })
    });

    const paymentData = await paymentIntent.json();

    // Save order record
    await supabase.from('express_orders').insert({
      offer_slug: slug,
      name,
      email,
      language: lang,
      notes,
      currency: priceData.currency,
      amount_cents: priceData.amount_cents,
      discount_cents: priceData.discount_cents || 0,
      coupon: coupon ? String(coupon).toUpperCase() : null,
      promo: promo ? String(promo).toUpperCase() : null,
      status: 'pending',
      airwallex_id: paymentData.id,
      airwallex_link: paymentData.next_action?.redirect_url || paymentData.url
    });

    const checkoutUrl = paymentData.next_action?.redirect_url || paymentData.url;

    return res.status(200).json({ ok: true, url: checkoutUrl });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
