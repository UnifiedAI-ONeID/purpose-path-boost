import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CAL_API_KEY = Deno.env.get('CAL_COM_API_KEY');
    if (!CAL_API_KEY) {
      return jsonResponse({ ok: false, error: 'Cal.com API key not configured' }, 200);
    }

    const url = new URL(req.url);
    const eventTypeId = url.searchParams.get('eventTypeId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    if (!eventTypeId) {
      return jsonResponse({ ok: false, error: 'eventTypeId is required' }, 200);
    }

    // Build availability query
    const params = new URLSearchParams({
      eventTypeId,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    const calResponse = await fetch(`https://api.cal.com/v1/availability?${params}`, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!calResponse.ok) {
      const error = await calResponse.text();
      console.error('Cal.com API error:', error);
      return jsonResponse({ ok: false, error: 'Failed to fetch availability' }, 200);
    }

    const availability = await calResponse.json();

    return jsonResponse({ ok: true, ...availability }, 200);
  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, 200);
  }
});
