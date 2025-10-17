import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { resolveTicketPrice } from '../_shared/event-pricing.ts';
import { validateCoupon, applyDiscount, recordCouponUse } from '../_shared/event-coupons.ts';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) && email.length <= 255;
}

function sanitizeInput(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 200);
  }

  try {
    const { event_id, ticket_id, name, email, language, coupon_code, currency } = await req.json();

    // Input validation
    if (!event_id || !ticket_id || !name || !email) {
      return jsonResponse({ error: 'Missing required fields' }, 200);
    }

    if (!validateEmail(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 200);
    }

    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedEmail = sanitizeInput(email.toLowerCase(), 255);

    if (sanitizedName.length < 2) {
      return jsonResponse({ error: 'Name must be at least 2 characters' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get ticket and event details
    const { data: ticket } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('id', ticket_id)
      .maybeSingle();

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .maybeSingle();

    if (!ticket || !event) {
      return jsonResponse({ error: 'Invalid ticket or event' }, 200);
    }

    // Resolve price in target currency
    const priceResult = await resolveTicketPrice(supabase, {
      ticket_id,
      target_currency: currency || 'USD'
    });

    let final_amount = priceResult.charge_cents;
    let final_currency = priceResult.currency;
    let discount_cents = 0;
    
    // Apply coupon if provided
    if (coupon_code) {
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
      return jsonResponse({ 
        error: decrementResult?.error || 'Unable to reserve ticket. Please try again.' 
      }, 200);
    }

    // Generate check-in code
    const checkin_code = crypto.randomUUID().substring(0, 12).toUpperCase();

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

    const status = final_amount > 0 ? 'pending' : 'paid';
    const url = final_amount > 0 ? `/events/${event.slug}?payment=pending` : null;

    // Insert registration
    const { data: regData, error: regError } = await supabase
      .from('event_regs')
      .insert([{ ...baseReg, status }])
      .select()
      .maybeSingle();

    if (regError || !regData) {
      // Rollback ticket if registration fails
      await supabase.rpc('decrement_ticket_qty', {
        p_ticket_id: ticket_id,
        p_amount: -1
      });
      throw regError || new Error('Failed to create registration');
    }

    // Record coupon usage if applicable
    if (coupon_code && discount_cents > 0) {
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

    return jsonResponse({ ok: true, url, registration_id: regData.id }, 200);
  } catch (e: any) {
    console.error('[api-events-register] Error:', e);
    return jsonResponse({ error: e.message || 'Registration failed' }, 200);
  }
});
