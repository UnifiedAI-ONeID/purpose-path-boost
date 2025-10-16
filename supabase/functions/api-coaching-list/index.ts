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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') || 'en';

    const { data, error } = await supabase
      .from('coaching_offers')
      .select('*')
      .order('sort', { ascending: true });

    if (error) {
      console.error('Coaching list error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message, rows: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Filter by locale if available
    const filtered = locale ? data?.filter(item => !item.locale || item.locale === locale) : data;

    return new Response(
      JSON.stringify({ ok: true, rows: filtered || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Coaching list handler error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error', rows: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
