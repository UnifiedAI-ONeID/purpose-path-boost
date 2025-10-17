import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const profileId = url.searchParams.get('profile_id');
    const tag = url.searchParams.get('tag');

    if (!profileId) {
      return jsonResponse({ ok: false, error: 'profile_id required', lessons: [] }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get lessons with progress
    let query = supabase
      .from('lessons')
      .select(`
        *,
        lesson_progress!left(
          profile_id,
          completed,
          last_position_sec,
          watched_seconds
        )
      `)
      .eq('published', true)
      .order('order_index', { ascending: true });

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[api-lessons-for-user] Query error:', error);
      return jsonResponse({ ok: false, error: error.message, lessons: [] }, 200);
    }

    return jsonResponse({ ok: true, lessons: data || [] }, 200);
  } catch (error) {
    console.error('[api-lessons-for-user] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message, lessons: [] }, 200);
  }
});
