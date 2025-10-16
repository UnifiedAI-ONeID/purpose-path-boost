const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CAL_API_KEY = Deno.env.get('CAL_COM_API_KEY');
    if (!CAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Cal.com API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const eventTypeId = url.searchParams.get('eventTypeId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    if (!eventTypeId) {
      return new Response(JSON.stringify({ error: 'eventTypeId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Failed to fetch availability' }), {
        status: calResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const availability = await calResponse.json();

    return new Response(JSON.stringify(availability), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
