import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const profile_id = url.searchParams.get('profile_id') || '';

  if (!profile_id) {
    return new Response(JSON.stringify({ ok: false, error: 'missing profile_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Fetch most recently watched incomplete lesson
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_slug, last_position_sec, last_watched_at')
    .eq('profile_id', profile_id)
    .eq('completed', false)
    .order('last_watched_at', { ascending: false })
    .limit(1);

  if (!progress?.length) {
    return new Response(JSON.stringify({ ok: true, item: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  const slug = progress[0].lesson_slug;
  const { data: lesson } = await supabase
    .from('lessons')
    .select('slug, title_en, poster_url, yt_id, cn_alt_url, duration_sec')
    .eq('slug', slug)
    .maybeSingle();

  const item = lesson ? {
    ...lesson,
    last_position_sec: progress[0].last_position_sec,
  } : null;

  return new Response(JSON.stringify({ ok: true, item }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
