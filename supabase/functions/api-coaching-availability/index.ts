import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, tz } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    if (!slug) {
      return jsonResponse({ ok: false, error: 'Missing slug parameter' }, 200);
    }

    const calApiKey = Deno.env.get('CAL_COM_API_KEY');
    if (!calApiKey) {
      console.error('[api-coaching-availability] Cal.com API key not configured');
      return jsonResponse({ ok: false, error: 'Calendar service not configured' }, 200);
    }

    console.log(`[api-coaching-availability] Looking up coaching offer: ${slug}`);

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

    if (offerError) {
      console.error('[api-coaching-availability] Database error:', offerError);
      return jsonResponse({ ok: false, error: 'Database error' }, 200);
    }

    if (!offer?.cal_event_type_slug) {
      console.error('[api-coaching-availability] Coaching offer not found:', slug);
      return jsonResponse({ 
        ok: false, 
        error: 'Coaching program not found or not configured for booking',
        details: 'This program may not have a calendar event type set up yet'
      }, 200);
    }

    console.log(`[api-coaching-availability] Found cal_event_type_slug: ${offer.cal_event_type_slug}`);

    // Then get the cal_event_type_id from cal_event_types
    const { data: eventType, error: eventTypeError } = await supabase
      .from('cal_event_types')
      .select('cal_event_type_id')
      .eq('slug', offer.cal_event_type_slug)
      .maybeSingle();

    if (eventTypeError) {
      console.error('[api-coaching-availability] Database error:', eventTypeError);
      return jsonResponse({ ok: false, error: 'Database error' }, 200);
    }

    if (!eventType?.cal_event_type_id) {
      console.error('[api-coaching-availability] Cal event type not synced:', offer.cal_event_type_slug);
      return jsonResponse({ 
        ok: false, 
        error: 'Calendar event not configured',
        details: `Event type "${offer.cal_event_type_slug}" needs to be synced from Cal.com first`
      }, 200);
    }

    console.log(`[api-coaching-availability] Using cal_event_type_id: ${eventType.cal_event_type_id}`);

    // Calculate date range (next 14 days)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 14);

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = endDate.toISOString().split('T')[0];

    // Build availability query params
    const params = new URLSearchParams({
      eventTypeId: eventType.cal_event_type_id,
      dateFrom,
      dateTo,
      ...(tz && { timeZone: tz }),
    });

    console.log(`[api-coaching-availability] Fetching from Cal.com API with params:`, params.toString());

    // Fetch availability from Cal.com using proper endpoint
    const response = await fetch(`https://api.cal.com/v1/availability?${params}`, {
      headers: {
        'Authorization': `Bearer ${calApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[api-coaching-availability] Cal.com API error:', response.status, errorText);
      return jsonResponse({ 
        ok: false, 
        error: 'Failed to fetch availability from calendar service',
        details: response.status === 401 ? 'Calendar API authentication failed' : undefined
      }, 200);
    }

    const data = await response.json();
    console.log(`[api-coaching-availability] Successfully fetched availability`);

    // Maintain backward compatibility: expose top-level `slots`
    const slots = (data && (data.slots || data.availableSlots || data.timeslots)) || [];
    return jsonResponse({ ok: true, slots, data }, 200);
  } catch (error) {
    console.error('[api-coaching-availability] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
