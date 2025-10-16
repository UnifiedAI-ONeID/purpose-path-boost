import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || '';
  const profile_id = url.searchParams.get('profile_id') || '';

  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: 'missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !lesson) {
    return new Response(JSON.stringify({ ok: false, error: 'Lesson not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
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

  return new Response(JSON.stringify({ ok: true, lesson, progress }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
