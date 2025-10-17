import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug') || '';
    const profile_id = url.searchParams.get('profile_id') || '';

    if (!slug) {
      return jsonResponse({ ok: false, error: 'missing slug' }, 200);
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
      return jsonResponse({ ok: false, error: 'Lesson not found' }, 200);
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

    return jsonResponse({ ok: true, lesson, progress }, 200, {
      'Cache-Control': 'no-store, max-age=0'
    });
  } catch (error) {
    console.error('[api-lessons-get] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
