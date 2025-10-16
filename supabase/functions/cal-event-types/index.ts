import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    if (action === 'sync') {
      // Check admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch event types from Cal.com API
      const CAL_API_KEY = Deno.env.get('CAL_COM_API_KEY');
      if (!CAL_API_KEY) {
        return new Response(JSON.stringify({ error: 'Cal.com API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const calResponse = await fetch('https://api.cal.com/v1/event-types', {
        headers: {
          'Authorization': `Bearer ${CAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!calResponse.ok) {
        const error = await calResponse.text();
        console.error('Cal.com API error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch from Cal.com' }), {
          status: calResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const calData = await calResponse.json();
      const eventTypes = calData.event_types || [];

      // Sync to database
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      for (const eventType of eventTypes) {
        const record = {
          cal_event_type_id: String(eventType.id),
          slug: eventType.slug,
          title: eventType.title,
          description: eventType.description || null,
          length: eventType.length,
          price: eventType.price || 0,
          currency: eventType.currency || 'USD',
          active: !eventType.hidden,
          metadata: eventType,
          last_synced_at: new Date().toISOString(),
        };

        await supabaseService.from('cal_event_types').upsert(record, { onConflict: 'cal_event_type_id' });
      }

      return new Response(JSON.stringify({ success: true, synced: eventTypes.length }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: list event types from database
    const { data: eventTypes, error } = await supabase
      .from('cal_event_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ event_types: eventTypes }), {
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
