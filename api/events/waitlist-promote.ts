import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_id } = req.body || {};

    if (!event_id) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Find tickets with available qty
    const { data: tickets } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', event_id);

    const available = (tickets || []).filter(t => t.qty > 0);
    
    if (available.length === 0) {
      return res.status(200).json({ ok: true, promoted: 0, message: 'No available tickets' });
    }

    // 2) Pick earliest waitlist registration
    const { data: waitlist } = await supabase
      .from('event_regs')
      .select('*')
      .eq('event_id', event_id)
      .eq('status', 'waitlist')
      .order('created_at', { ascending: true })
      .limit(1);

    if (!waitlist || waitlist.length === 0) {
      return res.status(200).json({ ok: true, promoted: 0, message: 'No waitlist registrations' });
    }

    const reg = waitlist[0];
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    // 3) Decrement ticket quantity (use their original ticket or first available)
    const ticket_id = reg.ticket_id || available[0].id;
    const ticket = available.find(t => t.id === ticket_id) || available[0];

    const { error: ticketError } = await supabase
      .from('event_tickets')
      .update({ qty: ticket.qty - 1 })
      .eq('id', ticket.id);

    if (ticketError) {
      return res.status(400).json({ ok: false, error: ticketError.message });
    }

    // 4) Mark offer on the waitlist registration
    const { error: updateError } = await supabase
      .from('event_regs')
      .update({
        offer_token: token,
        offer_expires_at: expiresAt,
        offer_sent_at: new Date().toISOString()
      })
      .eq('id', reg.id);

    if (updateError) {
      // Rollback ticket decrement
      await supabase
        .from('event_tickets')
        .update({ qty: ticket.qty })
        .eq('id', ticket.id);
      
      return res.status(400).json({ ok: false, error: updateError.message });
    }

    // Generate offer URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const offer_url = `${protocol}://${host}/events/offer?token=${token}`;

    res.status(200).json({
      ok: true,
      promoted: 1,
      offer_url,
      email: reg.email,
      expires_at: expiresAt
    });
  } catch (e: any) {
    console.error('Waitlist promotion error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
