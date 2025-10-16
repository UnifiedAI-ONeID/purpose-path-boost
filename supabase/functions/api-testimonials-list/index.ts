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

    console.log('[Testimonials] Fetching testimonials list');

    // Query testimonials - order by featured first, then by created_at
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, name, locale, quote, role, avatar_url, featured, created_at')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(9);

    if (error) {
      console.error('[Testimonials] Database error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message, rows: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[Testimonials] Successfully fetched ${data?.length || 0} testimonials`);

    return new Response(
      JSON.stringify({ ok: true, rows: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Testimonials] Handler error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || 'Internal server error', rows: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
