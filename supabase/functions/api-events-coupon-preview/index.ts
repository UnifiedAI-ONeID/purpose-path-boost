import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { validateCoupon, applyDiscount } from '../_shared/event-coupons.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const { event_id, ticket_id, email, code } = await req.json();

    if (!event_id || !ticket_id || !code) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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
      return new Response(
        JSON.stringify({ ok: false, reason: validation.reason }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('id', ticket_id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'Invalid ticket' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const priced = applyDiscount({
      price_cents: ticket.price_cents,
      ticket_currency: ticket.currency,
      coupon: validation.coupon
    });

    return new Response(
      JSON.stringify({
        ok: true,
        ...priced,
        original_cents: ticket.price_cents
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Coupon preview error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
