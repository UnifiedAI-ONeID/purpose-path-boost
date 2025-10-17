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

    // Get Cal.com API key
    const calApiKey = Deno.env.get('CAL_COM_API_KEY');
    
    if (!calApiKey) {
      return jsonResponse({ ok: false, error: 'Cal.com API not configured' }, 200);
    }

    // Fetch availability from Cal.com
    const response = await fetch(`https://api.cal.com/v1/event-types/${slug}/availability`, {
      headers: {
        'Authorization': `Bearer ${calApiKey}`,
        'Content-Type': 'application/json'
      }
    });

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
