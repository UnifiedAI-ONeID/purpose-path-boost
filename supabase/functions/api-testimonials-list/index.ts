import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ 
        ok: false, 
        error: 'Missing Supabase credentials',
        rows: [] 
      }, 200);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Testimonials v3] Fetching testimonials from database');

    // Fetch testimonials with explicit column selection
    // Table has: id, name, locale, quote, role, avatar_url, featured, created_at
    const { data: testimonials, error: dbError } = await supabase
      .from('testimonials')
      .select('id, name, locale, quote, role, avatar_url, featured, created_at')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(9);

    if (dbError) {
      console.error('Testimonials fetch error:', dbError);
      return jsonResponse({ 
        ok: false, 
        error: dbError.message || 'Database query failed',
        code: dbError.code,
        rows: [] 
      }, 200);
    }

    const rowCount = testimonials?.length ?? 0;
    console.log(`[Testimonials] Retrieved ${rowCount} testimonial(s)`);

    return jsonResponse({ 
      ok: true, 
      rows: testimonials ?? [],
      count: rowCount
    }, 200);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Testimonials] Error:', errorMessage);
    
    return jsonResponse({ 
      ok: false, 
      error: errorMessage,
      rows: [] 
    }, 200);
  }
});
