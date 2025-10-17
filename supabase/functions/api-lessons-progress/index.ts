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

    // Validate UUID format
    if (!profile_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile_id)) {
      return jsonResponse({ ok: false, error: 'Invalid profile ID' }, 400);
    }

    // Validate lesson slug
    if (!lesson_slug || typeof lesson_slug !== 'string' || lesson_slug.length > 100) {
      return jsonResponse({ ok: false, error: 'Invalid lesson slug' }, 400);
    }

    // Validate numeric ranges
    if (last_position_sec !== undefined && (typeof last_position_sec !== 'number' || last_position_sec < 0 || last_position_sec > 86400)) {
      return jsonResponse({ ok: false, error: 'Invalid position' }, 400);
    }

    if (watched_seconds !== undefined && (typeof watched_seconds !== 'number' || watched_seconds < 0 || watched_seconds > 86400)) {
      return jsonResponse({ ok: false, error: 'Invalid duration' }, 400);
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
      return jsonResponse({ ok: false, error: 'Unable to update progress' }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error('[api-lessons-progress] Error:', error);
    return jsonResponse({ ok: false, error: 'Unable to update progress' }, 500);
  }
});
