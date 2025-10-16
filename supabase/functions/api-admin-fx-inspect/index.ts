import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const url = new URL(req.url);
    const ticketId = url.searchParams.get('ticketId');

    if (!ticketId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing ticketId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('event_tickets')
      .select('*, events(*)')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Ticket not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get FX overrides for this ticket
    const { data: overrides, error: overridesError } = await supabase
      .from('event_ticket_fx_overrides')
      .select('*')
      .eq('ticket_id', ticketId);

    if (overridesError) {
      console.error('FX overrides fetch error:', overridesError);
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        ticket, 
        overrides: overrides || [] 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('FX inspect error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
