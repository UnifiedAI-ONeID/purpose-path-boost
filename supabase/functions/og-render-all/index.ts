import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAT_SIZES = ['linkedin', 'facebook', 'x', 'ig_square', 'ig_portrait', 'story'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const body = await req.json();
    const { title, subtitle = '', slug, theme = 'light', lang = 'en', tag = '' } = body;

    if (!title || !slug) {
      return new Response(JSON.stringify({ error: 'missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating all images for: ${title}`);

    const results: any[] = [];

    for (const size of PLAT_SIZES) {
      try {
        const { data, error } = await supabase.functions.invoke('og-render', {
          body: { title, subtitle, slug, theme, lang, size, tag },
        });

        if (error) throw error;

        results.push({ key: size, ...data });
      } catch (error: any) {
        console.error(`Error rendering ${size}:`, error);
        results.push({ key: size, ok: false, error: error.message });
      }
    }

    console.log(`Generated ${results.filter(r => r.ok).length}/${results.length} images`);

    return new Response(JSON.stringify({ ok: true, images: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in og-render-all:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
