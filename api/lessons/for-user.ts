import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const profile_id = url.searchParams.get('profile_id') || '';
  const tags = (url.searchParams.get('tags') || '').split(',').filter(Boolean);

  if (!profile_id) {
    return new Response(JSON.stringify({ ok: false, error: 'missing profile_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Fetch assigned lessons by tags or get all published
  const { data: assigned } = await supabase
    .from('lesson_assignments')
    .select('lesson_slug, order_index')
    .in('tag', tags.length ? tags : ['_all_'])
    .order('order_index');

  const assignedSlugs = (assigned || []).map(r => r.lesson_slug);

  let { data: lessons } = await supabase
    .from('lessons')
    .select('slug, title_en, summary_en, poster_url, yt_id, duration_sec, tags, order_index, cn_alt_url, captions_vtt_url, published')
    .eq('published', true)
    .order('order_index');

  // Filter and sort by assignments if present
  if (assignedSlugs.length) {
    lessons = (lessons || [])
      .filter(l => assignedSlugs.includes(l.slug))
      .sort((a, b) => assignedSlugs.indexOf(a.slug) - assignedSlugs.indexOf(b.slug));
  }

  // Fetch progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_slug, completed, last_position_sec, watched_seconds')
    .eq('profile_id', profile_id);

  const progressMap = new Map((progress || []).map(p => [p.lesson_slug, p]));
  const rows = (lessons || []).map(l => ({ 
    ...l, 
    progress: progressMap.get(l.slug) || null 
  }));

  return new Response(JSON.stringify({ ok: true, rows }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
