import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 200);
  }

  try {
    const { profile_id, lesson_slug, last_position_sec, watched_seconds, completed } = await req.json();

    if (!profile_id || !lesson_slug) {
      return jsonResponse({ ok: false, error: 'profile_id and lesson_slug required' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        profile_id,
        lesson_slug,
        last_position_sec: last_position_sec || 0,
        watched_seconds: watched_seconds || 0,
        completed: completed || false,
        last_watched_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,lesson_slug'
      });

    if (error) {
      console.error('[api-lessons-progress] Update error:', error);
      return jsonResponse({ ok: false, error: error.message }, 200);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error('[api-lessons-progress] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
