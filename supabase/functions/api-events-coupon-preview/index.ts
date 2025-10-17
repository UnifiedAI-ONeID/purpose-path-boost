import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { validateCoupon, applyDiscount } from '../_shared/event-coupons.ts';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 200);
  }

  try {
    const { event_id, ticket_id, email, code } = await req.json();

    if (!event_id || !ticket_id || !code) {
      return jsonResponse({ ok: false, reason: 'Missing required fields' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const validation = await validateCoupon(supabase, {
      event_id,
      ticket_id,
      email: email || '',
      code
    });

    if (!validation.ok) {
      return jsonResponse({ ok: false, reason: validation.reason }, 200);
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('id', ticket_id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return jsonResponse({ ok: false, reason: 'Invalid ticket' }, 200);
    }

    const priced = applyDiscount({
      price_cents: ticket.price_cents,
      ticket_currency: ticket.currency,
      coupon: validation.coupon
    });

    return jsonResponse({
      ok: true,
      ...priced,
      original_cents: ticket.price_cents
    }, 200);
  } catch (e: any) {
    console.error('[api-events-coupon-preview] Error:', e);
    return jsonResponse({ ok: false, error: e.message }, 200);
  }
});
