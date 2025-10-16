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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const ticketId = url.searchParams.get('ticketId');

      if (ticketId) {
        // Get overrides for specific ticket
        const { data, error } = await supabase
          .from('event_ticket_fx_overrides')
          .select('*')
          .eq('ticket_id', ticketId);

        if (error) {
          console.error('Fetch overrides error:', error);
          return new Response(
            JSON.stringify({ ok: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        return new Response(
          JSON.stringify({ ok: true, overrides: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get all overrides
      const { data, error } = await supabase
        .from('event_ticket_fx_overrides')
        .select('*, event_tickets(name, events(title))');

      if (error) {
        console.error('Fetch all overrides error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, overrides: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { ticketId, currency, priceCents } = await req.json();

      if (!ticketId || !currency || priceCents === undefined) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Missing required parameters' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error } = await supabaseAdmin
        .from('event_ticket_fx_overrides')
        .upsert({ 
          ticket_id: ticketId, 
          currency, 
          price_cents: priceCents 
        }, { onConflict: 'ticket_id,currency' });

      if (error) {
        console.error('Upsert override error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Missing id' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error } = await supabaseAdmin
        .from('event_ticket_fx_overrides')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete override error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  } catch (error) {
    console.error('Tickets overrides error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
