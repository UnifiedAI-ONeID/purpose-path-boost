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
    const slug = url.searchParams.get('slug') || '';
    const profile_id = url.searchParams.get('profile_id') || '';

    if (!slug) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing slug' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !lesson) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Lesson not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Fetch user progress if profile_id provided
    let progress = null;
    if (profile_id) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('last_position_sec, completed, watched_seconds')
        .eq('profile_id', profile_id)
        .eq('lesson_slug', slug)
        .maybeSingle();
      
      progress = progressData || null;
    }

    return new Response(
      JSON.stringify({ ok: true, lesson, progress }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  } catch (error) {
    console.error('Lesson get error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
