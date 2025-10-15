import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body || {};

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Get registration with ticket details
    const { data: reg, error: regError } = await supabase
      .from('event_regs')
      .select(`
        *,
        event_tickets!inner(*),
        events!inner(*)
      `)
      .eq('offer_token', token)
      .single();

    if (regError || !reg) {
      return res.status(400).json({ error: 'Invalid or expired offer token' });
    }

    if (reg.status !== 'waitlist') {
      return res.status(400).json({ error: 'Offer already processed' });
    }

    // Check if offer expired
    if (reg.offer_expires_at && new Date(reg.offer_expires_at) < new Date()) {
      // Return seat to inventory
      await supabase
        .from('event_tickets')
        .update({ qty: reg.event_tickets.qty + 1 })
        .eq('id', reg.ticket_id);

      return res.status(400).json({ error: 'This offer has expired' });
    }

    const ticket = reg.event_tickets;
    const event = reg.events;

    // If free ticket, mark as paid immediately
    if (ticket.price_cents === 0) {
      const { error: updateError } = await supabase
        .from('event_regs')
        .update({ status: 'paid' })
        .eq('id', reg.id);

      if (updateError) throw updateError;

      return res.status(200).json({
        ok: true,
        url: `/events/${event.slug}?paid=1`
      });
    }

    // For paid tickets, create Airwallex payment intent
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;

    // Note: This requires AIRWALLEX_TOKEN environment variable
    const airwallexResp = await fetch('https://api.airwallex.com/api/v1/pa/payment_intents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRWALLEX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request_id: crypto.randomUUID(),
        amount: ticket.price_cents,
        currency: ticket.currency,
        merchant_order_id: `WL-${reg.id}`,
        return_url: `${protocol}://${host}/events/${event.slug}?paid=1`,
        cancel_url: `${protocol}://${host}/events/${event.slug}?cancel=1`,
        descriptor: `ZhenGrowth ${event.title}`
      })
    });

    const airwallexData = await airwallexResp.json();

    if (!airwallexResp.ok) {
      throw new Error(airwallexData.message || 'Payment initialization failed');
    }

    // Update registration with payment link
    const { error: updateError } = await supabase
      .from('event_regs')
      .update({
        airwallex_id: airwallexData.id,
        airwallex_link: airwallexData.next_action?.redirect_url || airwallexData.checkout_url || null
      })
      .eq('id', reg.id);

    if (updateError) throw updateError;

    res.status(200).json({
      ok: true,
      url: airwallexData.next_action?.redirect_url || airwallexData.checkout_url
    });
  } catch (e: any) {
    console.error('Offer acceptance error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
