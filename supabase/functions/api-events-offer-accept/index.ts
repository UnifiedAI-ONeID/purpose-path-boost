import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
    const { token } = await req.json();

    if (!token || typeof token !== 'string' || token.length !== 32) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
      return new Response(
        JSON.stringify({ error: 'Invalid or expired offer token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (reg.status !== 'waitlist') {
      return new Response(
        JSON.stringify({ error: 'Offer already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if offer expired
    if (reg.offer_expires_at && new Date(reg.offer_expires_at) < new Date()) {
      // Return seat to inventory
      await supabase
        .from('event_tickets')
        .update({ qty: reg.event_tickets.qty + 1 })
        .eq('id', reg.ticket_id);

      return new Response(
        JSON.stringify({ error: 'This offer has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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

      return new Response(
        JSON.stringify({
          ok: true,
          url: `/events/${event.slug}?paid=1`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For paid tickets, return payment pending URL
    return new Response(
      JSON.stringify({
        ok: true,
        url: `/events/${event.slug}?payment=pending`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Offer acceptance error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
