import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_id, ticket_id, name, email, language } = req.body || {};

    if (!event_id || !ticket_id || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return res.status(400).json({ error: 'Invalid ticket' });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return res.status(400).json({ error: 'Invalid event' });
    }

    // Check ticket availability
    if (ticket.qty <= 0) {
      return res.status(400).json({ error: 'This ticket is sold out' });
    }

    // Generate check-in code
    const checkin_code = crypto.randomBytes(6).toString('hex').toUpperCase();

    const baseReg = {
      event_id,
      ticket_id,
      name,
      email,
      language: language || 'en',
      amount_cents: ticket.price_cents,
      currency: ticket.currency,
      checkin_code
    };

    let url = null;
    let airwallex_id = null;
    let status = 'pending';

    // Handle paid tickets
    if (ticket.price_cents > 0) {
      // For now, we'll just create a pending registration
      // In production, integrate with Airwallex API
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      
      // Note: This is a placeholder. In production, you would:
      // 1. Call Airwallex API to create payment intent
      // 2. Get the hosted payment page URL
      // 3. Store the payment intent ID
      
      url = `${protocol}://${host}/events/${event.slug}?payment=pending`;
      airwallex_id = `mock-${crypto.randomUUID()}`;
    } else {
      // Free ticket - mark as paid immediately
      status = 'paid';
    }

    // Insert registration
    const { error: regError } = await supabase
      .from('event_regs')
      .insert([{ ...baseReg, status, airwallex_id, airwallex_link: url }]);

    if (regError) throw regError;

    // Decrement ticket quantity
    const { error: updateError } = await supabase
      .from('event_tickets')
      .update({ qty: ticket.qty - 1 })
      .eq('id', ticket_id);

    if (updateError) throw updateError;

    res.status(200).json({ ok: true, url });
  } catch (e: any) {
    console.error('Registration error:', e);
    res.status(400).json({ error: e.message || 'Registration failed' });
  }
}
