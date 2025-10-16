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
    const url = new URL(req.url);
    const profile_id = url.searchParams.get('profile_id') || '';
    
    if (!profile_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing profile_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data } = await supabase
      .from('nudge_inbox')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('seen', false)
      .gte('expire_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    return new Response(
      JSON.stringify({ ok: true, rows: data || [] }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (e: any) {
    console.error('Nudge pull error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
