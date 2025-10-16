import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
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

    const { testId, winningVariant } = await req.json();

    if (!testId || !winningVariant) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing testId or winningVariant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the winning test details
    const { data: winningTest, error: testError } = await supabase
      .from('event_price_tests')
      .select('*')
      .eq('id', testId)
      .eq('variant', winningVariant)
      .maybeSingle();

    if (testError || !winningTest) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Test not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Apply the winning price as an override
    const { error: upsertError } = await supabase
      .from('event_ticket_fx_overrides')
      .upsert({
        ticket_id: winningTest.ticket_id,
        currency: winningTest.currency,
        price_cents: winningTest.price_cents
      }, { onConflict: 'ticket_id,currency' });

    if (upsertError) {
      console.error('Adopt winner upsert error:', upsertError);
      return new Response(
        JSON.stringify({ ok: false, error: upsertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Mark all tests for this ticket/region as ended
    const { error: endError } = await supabase
      .from('event_price_tests')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('ticket_id', winningTest.ticket_id)
      .eq('region', winningTest.region);

    if (endError) {
      console.error('End tests error:', endError);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Adopt winner error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
