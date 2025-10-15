import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Roll up yesterday by default (or specific day from query params)
    const url = new URL(req.url);
    const dayParam = url.searchParams.get('day');
    
    const targetDate = dayParam 
      ? new Date(dayParam)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const day = targetDate.toISOString().slice(0, 10);

    console.log(`Rolling up metrics for ${day}`);

    // Delete existing rollup for this day
    const { error: deleteError } = await supabaseClient.rpc('rollup_delete_day', {
      p_day: day,
    });

    if (deleteError) {
      console.error('Delete rollup error:', deleteError);
      return new Response(
        JSON.stringify({ ok: false, error: deleteError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new rollup
    const { error: insertError } = await supabaseClient.rpc('rollup_insert_day', {
      p_day: day,
    });

    if (insertError) {
      console.error('Insert rollup error:', insertError);
      return new Response(
        JSON.stringify({ ok: false, error: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Successfully rolled up metrics for ${day}`);

    return new Response(
      JSON.stringify({ ok: true, day }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Metrics rollup error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
