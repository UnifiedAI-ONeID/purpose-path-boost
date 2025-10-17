import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    if (!slug) {
      return jsonResponse({ ok: false, error: 'Missing slug parameter' }, 200);
    }

    const calApiKey = Deno.env.get('CAL_COM_API_KEY');
    if (!calApiKey) {
      return jsonResponse({ ok: false, error: 'Cal.com API not configured' }, 200);
    }

    // Look up Cal.com event type ID from coaching offer slug
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // First get the cal_event_type_slug from coaching_offers
    const { data: offer, error: offerError } = await supabase
      .from('coaching_offers')
      .select('cal_event_type_slug')
      .eq('slug', slug)
      .maybeSingle();

    if (offerError || !offer?.cal_event_type_slug) {
      console.error('[api-coaching-availability] Coaching offer not found:', slug);
      return jsonResponse({ ok: false, error: 'Coaching offer not found' }, 200);
    }

    // Then get the cal_event_type_id from cal_event_types
    const { data: eventType, error: eventTypeError } = await supabase
      .from('cal_event_types')
      .select('cal_event_type_id')
      .eq('slug', offer.cal_event_type_slug)
      .maybeSingle();

    if (eventTypeError || !eventType?.cal_event_type_id) {
      console.error('[api-coaching-availability] Cal event type not found:', offer.cal_event_type_slug);
      return jsonResponse({ ok: false, error: 'Calendar event type not configured' }, 200);
    }

    // Fetch availability from Cal.com using the event type ID
    const response = await fetch(
      `https://api.cal.com/v1/event-types/${eventType.cal_event_type_id}/availability`, 
      {
        headers: {
          'Authorization': `Bearer ${calApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('[api-coaching-availability] Cal.com API error:', response.status);
      return jsonResponse({ ok: false, error: 'Failed to fetch availability' }, 200);
    }

    const data = await response.json();

    return jsonResponse({ ok: true, ...data }, 200);
  } catch (error) {
    console.error('[api-coaching-availability] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
