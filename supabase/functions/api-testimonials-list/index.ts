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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Testimonials v2] Fetching testimonials from database');

    // Fetch testimonials with explicit column selection
    // Table has: id, name, locale, quote, role, avatar_url, featured, created_at
    const { data: testimonials, error: dbError } = await supabase
      .from('testimonials')
      .select('id, name, locale, quote, role, avatar_url, featured, created_at')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(9);

    if (dbError) {
      console.error('[Testimonials v2] Database query failed:', JSON.stringify(dbError));
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: dbError.message || 'Database query failed',
          code: dbError.code,
          rows: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const rowCount = testimonials?.length ?? 0;
    console.log(`[Testimonials v2] Successfully retrieved ${rowCount} testimonial(s)`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        rows: testimonials ?? [],
        count: rowCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Testimonials v2] Unexpected error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: errorMessage,
        rows: [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
