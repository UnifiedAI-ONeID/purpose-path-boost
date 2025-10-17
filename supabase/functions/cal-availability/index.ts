import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CAL_API_KEY = Deno.env.get('CAL_COM_API_KEY');
    if (!CAL_API_KEY) {
      console.error('[cal-availability] Cal.com API key not configured');
      return jsonResponse({ ok: false, error: 'Calendar service not configured' }, 200);
    }

    // Parse request body for POST or query params for GET
    const { slug, tz, days } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    if (!slug) {
      return jsonResponse({ ok: false, error: 'slug is required' }, 200);
    }

    console.log(`[cal-availability] Looking up slug: ${slug}`);

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
      console.error('[cal-availability] Database error fetching offer:', offerError);
      return jsonResponse({ ok: false, error: 'Database error' }, 200);
    }

    if (!offer?.cal_event_type_slug) {
      console.error('[cal-availability] Coaching offer not found:', slug);
      return jsonResponse({ 
        ok: false, 
        error: 'Coaching program not found or not configured for booking',
        details: 'This program may not have a calendar event type set up yet'
      }, 200);
    }

    console.log(`[cal-availability] Found cal_event_type_slug: ${offer.cal_event_type_slug}`);

    // Then get the cal_event_type_id from cal_event_types
    const { data: eventType, error: eventTypeError } = await supabase
      .from('cal_event_types')
      .select('cal_event_type_id')
      .eq('slug', offer.cal_event_type_slug)
      .maybeSingle();

    if (eventTypeError) {
      console.error('[cal-availability] Database error fetching event type:', eventTypeError);
      return jsonResponse({ ok: false, error: 'Database error' }, 200);
    }

    if (!eventType?.cal_event_type_id) {
      console.error('[cal-availability] Cal event type not found in database:', offer.cal_event_type_slug);
      return jsonResponse({ 
        ok: false, 
        error: 'Calendar event not configured',
        details: `Event type "${offer.cal_event_type_slug}" needs to be synced from Cal.com`
      }, 200);
    }

    const eventTypeId = eventType.cal_event_type_id;
    console.log(`[cal-availability] Using cal_event_type_id: ${eventTypeId}`);

    // Calculate date range
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (days || 14));

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = endDate.toISOString().split('T')[0];

    // Build availability query
    const params = new URLSearchParams({
      eventTypeId,
      dateFrom,
      dateTo,
      ...(tz && { timeZone: tz }),
    });

    console.log(`[cal-availability] Fetching from Cal.com API with params:`, params.toString());

    const calResponse = await fetch(`https://api.cal.com/v1/availability?${params}`, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!calResponse.ok) {
      const error = await calResponse.text();
      console.error('[cal-availability] Cal.com API error:', error);
      return jsonResponse({ ok: false, error: 'Failed to fetch availability from calendar service' }, 200);
    }

    const availability = await calResponse.json();
    console.log(`[cal-availability] Successfully fetched availability`);

    return jsonResponse({ ok: true, ...availability }, 200);
  } catch (error) {
    console.error('[cal-availability] Unexpected error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 200);
  }
});
