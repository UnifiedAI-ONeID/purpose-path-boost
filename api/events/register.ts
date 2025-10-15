import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { resolveTicketPrice } from './_price';

// Input validation helper
function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) && email.length <= 255;
}

function sanitizeInput(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_id, ticket_id, name, email, language, coupon_code, currency } = req.body || {};

    // Input validation
    if (!event_id || !ticket_id || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedEmail = sanitizeInput(email.toLowerCase(), 255);

    if (sanitizedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    // Rate limiting check
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.socket.remoteAddress || 
                     'unknown';

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check rate limiting - max 3 attempts per email per event in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('registration_attempts')
      .select('count')
      .eq('email', sanitizedEmail)
      .eq('event_id', event_id)
      .gte('attempted_at', fiveMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
    }

    // Log attempt
    await supabase.from('registration_attempts').insert([{
      email: sanitizedEmail,
      ip_address: clientIp,
      event_id,
      success: false
    }]);

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

    // Resolve price in target currency
    const priceResult = await resolveTicketPrice(supabase, {
      ticket_id,
      target_currency: currency || 'USD'
    });

    let final_amount = priceResult.charge_cents;
    let final_currency = priceResult.currency;
    let discount_cents = 0;
    
    // Apply coupon if provided (applied AFTER currency conversion)
    if (coupon_code) {
      const { validateCoupon, applyDiscount, recordCouponUse } = await import('./_coupon');
      const validation = await validateCoupon(supabase, {
        event_id,
        ticket_id,
        email: sanitizedEmail,
        code: coupon_code
      });
      
      if (validation.ok && validation.coupon) {
        const priced = applyDiscount({
          price_cents: final_amount,
          ticket_currency: final_currency,
          coupon: validation.coupon
        });
        discount_cents = priced.discount_cents;
        final_amount = priced.total_cents;
      }
    }

    // Use atomic function to decrement ticket quantity
    const { data: decrementResult } = await supabase.rpc('decrement_ticket_qty', {
      p_ticket_id: ticket_id,
      p_amount: 1
    });

    if (!decrementResult || !decrementResult.ok) {
      return res.status(400).json({ 
        error: decrementResult?.error || 'Unable to reserve ticket. Please try again.' 
      });
    }

    // Generate check-in code
    const checkin_code = crypto.randomBytes(6).toString('hex').toUpperCase();

    const baseReg = {
      event_id,
      ticket_id,
      name: sanitizedName,
      email: sanitizedEmail,
      language: language || 'en',
      amount_cents: final_amount,
      currency: final_currency,
      checkin_code,
      coupon_code: coupon_code || null,
      discount_cents
    };

    let url = null;
    let airwallex_id = null;
    let status = 'pending';

    // Handle paid tickets
    if (final_amount > 0) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      
      // Create Airwallex payment intent with resolved currency
      const airwallexBody = {
        request_id: crypto.randomUUID(),
        amount: final_amount,
        currency: final_currency,
        merchant_order_id: `EVT-${event.slug}-${Date.now()}`,
        return_url: `${protocol}://${host}/events/${event.slug}?paid=1`,
        cancel_url: `${protocol}://${host}/events/${event.slug}?cancel=1`,
        descriptor: `ZhenGrowth ${event.title}`
      };

      if (process.env.AIRWALLEX_TOKEN) {
        const airwallexResp = await fetch('https://api.airwallex.com/api/v1/pa/payment_intents/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AIRWALLEX_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(airwallexBody)
        });

        const airwallexData = await airwallexResp.json();
        
        if (airwallexResp.ok) {
          airwallex_id = airwallexData.id;
          url = airwallexData.next_action?.redirect_url || airwallexData.checkout_url || null;
        } else {
          console.error('Airwallex error:', airwallexData);
          url = `${protocol}://${host}/events/${event.slug}?payment=pending`;
          airwallex_id = `mock-${crypto.randomUUID()}`;
        }
      } else {
        // Development mode without Airwallex
        url = `${protocol}://${host}/events/${event.slug}?payment=pending`;
        airwallex_id = `mock-${crypto.randomUUID()}`;
      }
    } else {
      // Free ticket - mark as paid immediately
      status = 'paid';
    }

    // Insert registration
    const { data: regData, error: regError } = await supabase
      .from('event_regs')
      .insert([{ ...baseReg, status, airwallex_id, airwallex_link: url }])
      .select()
      .single();

    if (regError) {
      // Rollback ticket if registration fails
      await supabase.rpc('decrement_ticket_qty', {
        p_ticket_id: ticket_id,
        p_amount: -1 // Add back
      });
      throw regError;
    }

    // Record coupon usage if applicable
    if (coupon_code && discount_cents > 0) {
      const { validateCoupon, applyDiscount, recordCouponUse } = await import('./_coupon');
      const validation = await validateCoupon(supabase, {
        event_id,
        ticket_id,
        email: sanitizedEmail,
        code: coupon_code
      });
      
      if (validation.ok && validation.coupon) {
        await recordCouponUse(supabase, {
          coupon_id: validation.coupon.id,
          event_id,
          email: sanitizedEmail,
          reg_id: regData.id
        });
      }
    }

    // Mark attempt as successful
    await supabase.from('registration_attempts')
      .update({ success: true })
      .eq('email', sanitizedEmail)
      .eq('event_id', event_id)
      .gte('attempted_at', fiveMinutesAgo);

    res.status(200).json({ ok: true, url, registration_id: regData.id });
  } catch (e: any) {
    console.error('Registration error:', e);
    res.status(400).json({ error: e.message || 'Registration failed' });
  }
}
