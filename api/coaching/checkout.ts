import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { slug, name, email, notes = '', currency = 'USD' } = req.body || {};

    if (!slug || !name || !email) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get offer
    const { data: offer, error: offerError } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (offerError || !offer || offer.billing_type !== 'paid') {
      return res.status(400).json({ ok: false, error: 'Offer not found or not paid' });
    }

    // Get pricing
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = req.headers.host as string;
    const baseUrl = `${protocol}://${host}`;

    const priceResponse = await fetch(`${baseUrl}/api/coaching/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, currency })
    });

    const priceData = await priceResponse.json();

    if (!priceData?.ok || !priceData.amount_cents) {
      return res.status(400).json({ ok: false, error: 'Pricing error' });
    }

    // Create Airwallex payment intent
    const airwallexToken = process.env.AIRWALLEX_API_KEY;
    
    if (!airwallexToken) {
      return res.status(500).json({ ok: false, error: 'Payment gateway not configured' });
    }

    const paymentIntent = await fetch('https://api.airwallex.com/api/v1/pa/payment_intents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airwallexToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request_id: crypto.randomUUID(),
        amount: priceData.amount_cents / 100, // Airwallex uses decimal amounts
        currency: priceData.currency,
        merchant_order_id: `COACH-${slug}-${Date.now()}`,
        return_url: `${baseUrl}/coaching/${slug}?paid=1&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
        cancel_url: `${baseUrl}/coaching/${slug}?cancel=1`,
        descriptor: `ZhenGrowth ${offer.title_en || slug}`
      })
    });

    const paymentData = await paymentIntent.json();

    // Save order record (reusing express_orders table)
    await supabase.from('express_orders').insert({
      offer_slug: slug,
      name,
      email,
      language: 'en',
      notes,
      currency: priceData.currency,
      amount_cents: priceData.amount_cents,
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
