import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { sbSrv } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);
    
    if (!isAdmin) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const { event_id, ticket_id, variants } = await req.json();
    
    if (!event_id || !ticket_id || !Array.isArray(variants)) {
      return jsonResponse({ 
        ok: false, 
        error: 'Event ID, ticket ID and variants required' 
      }, 400);
    }

    const supabase = sbSrv();

    // Delete existing price tests for this ticket
    await supabase
      .from('event_price_tests')
      .delete()
      .eq('ticket_id', ticket_id);

    // Insert new variants
    const rows = variants.map(v => ({
      event_id,
      ticket_id,
      variant: v.variant || 'control',
      region: v.region || 'global',
      currency: v.currency,
      price_cents: v.price_cents,
      is_active: true,
      started_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('event_price_tests')
      .insert(rows);

    if (error) throw error;

    console.log(`[admin-events-tickets-price-test] Updated ${variants.length} price tests for ticket ${ticket_id}`);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[admin-events-tickets-price-test] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
