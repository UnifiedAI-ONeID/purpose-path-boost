import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { validateCoupon, applyDiscount } from './_coupon';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_id, ticket_id, email, code } = req.body || {};

    if (!event_id || !ticket_id || !code) {
      return res.status(400).json({ ok: false, reason: 'Missing required fields' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Validate coupon
    const validation = await validateCoupon(supabase, {
      event_id,
      ticket_id,
      email: email || '',
      code
    });

    if (!validation.ok) {
      return res.status(200).json({ ok: false, reason: validation.reason });
    }

    // Get ticket price
    const { data: ticket, error: ticketError } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return res.status(400).json({ ok: false, reason: 'Invalid ticket' });
    }

    // Calculate discount
    const priced = applyDiscount({
      price_cents: ticket.price_cents,
      ticket_currency: ticket.currency,
      coupon: validation.coupon
    });

    res.status(200).json({
      ok: true,
      ...priced,
      original_cents: ticket.price_cents
    });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}
