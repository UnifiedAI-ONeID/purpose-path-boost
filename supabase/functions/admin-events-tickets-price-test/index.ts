import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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

    const { event_id, variants } = await req.json();
    
    if (!event_id || !Array.isArray(variants)) {
      return jsonResponse({ 
        ok: false, 
        error: 'Event ID and variants array required' 
      }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Delete existing prices for this event
    await supabase
      .from('event_prices')
      .delete()
      .eq('event_id', event_id);

    // Insert new price variants
    if (variants.length > 0) {
      const { error } = await supabase
        .from('event_prices')
        .insert(variants.map(v => ({ ...v, event_id })));
      
      if (error) throw error;
    }

    console.log(`[admin-events-tickets-price-test] Updated ${variants.length} price variants for event ${event_id}`);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[admin-events-tickets-price-test] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
