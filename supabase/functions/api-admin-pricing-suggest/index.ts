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

    const { ticketId, region } = await req.json();

    if (!ticketId || !region) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing ticketId or region' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get active price tests for this ticket and region
    const { data: tests, error } = await supabase
      .from('event_price_tests')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('region', region)
      .eq('is_active', true);

    if (error) {
      console.error('Price tests fetch error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get assignment data to calculate conversion rates
    const { data: assignments } = await supabase
      .from('event_price_assignments')
      .select('variant, visitor_id')
      .in('test_id', tests?.map(t => t.id) || []);

    // Get registration data
    const { data: registrations } = await supabase
      .from('event_regs')
      .select('email')
      .eq('ticket_id', ticketId)
      .eq('status', 'paid');

    // Calculate conversion rates for each variant
    const suggestions = tests?.map(test => {
      const variantAssignments = assignments?.filter(a => a.variant === test.variant).length || 0;
      const variantConversions = registrations?.length || 0;
      const conversionRate = variantAssignments > 0 ? (variantConversions / variantAssignments) * 100 : 0;

      return {
        variant: test.variant,
        price_cents: test.price_cents,
        currency: test.currency,
        assignments: variantAssignments,
        conversions: variantConversions,
        conversion_rate: conversionRate.toFixed(2),
      };
    }) || [];

    return new Response(
      JSON.stringify({ ok: true, suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pricing suggest error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
