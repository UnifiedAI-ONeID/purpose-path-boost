import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const event_id = url.searchParams.get('event_id');

    if (!event_id) {
      return jsonResponse({ ok: false, error: 'Event ID is required' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', event_id)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('[api-events-tickets] Error:', error);
      return jsonResponse({ ok: false, error: error.message, tickets: [] }, 200);
    }

    return jsonResponse({ ok: true, tickets: data || [] }, 200);
  } catch (e: any) {
    console.error('[api-events-tickets] Error:', e);
    return jsonResponse({ ok: false, error: e.message || 'Unknown error', tickets: [] }, 200);
  }
});
