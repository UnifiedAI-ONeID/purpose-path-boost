import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);

    if (!slug) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing slug parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get Cal.com API key
    const calApiKey = Deno.env.get('CAL_COM_API_KEY');
    
    if (!calApiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Cal.com API not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fetch availability from Cal.com
    const response = await fetch(`https://api.cal.com/v1/event-types/${slug}/availability`, {
      headers: {
        'Authorization': `Bearer ${calApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to fetch availability' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ ok: true, ...data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Coaching availability error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
