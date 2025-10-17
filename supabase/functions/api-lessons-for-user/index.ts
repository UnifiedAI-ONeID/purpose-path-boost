import { json, bad, sbAnon, qs, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const pid = qs(req).get('profile_id');
  const tags = (qs(req).get('tags') || '').split(',').filter(Boolean);
  
  if (!pid) return bad('MISSING_PROFILE');
  
  const s = sbAnon(req);

  // Get assigned lessons
  const assigned = await s
    .from('lesson_assignments')
    .select('lesson_slug,order_index')
    .in('tag', tags.length ? tags : ['_all_'])
    .order('order_index');
  
  const slugs = (assigned.data || []).map(x => x.lesson_slug);

  // Get lessons
  let { data: lessons } = await s
    .from('lessons')
    .select('slug,title_en,summary_en,poster_url,yt_id,duration_sec,tags,order_index,cn_alt_url,captions_vtt_url,published')
    .eq('published', true)
    .order('order_index');

  if (slugs.length) {
    lessons = (lessons || [])
      .filter(l => slugs.includes(l.slug))
      .sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
  }

  // Get progress
  const prog = await s
    .from('lesson_progress')
    .select('lesson_slug,completed,last_position_sec')
    .eq('profile_id', pid);

  const map = new Map((prog.data || []).map(p => [p.lesson_slug, p]));

  return json({
    ok: true,
    rows: (lessons || []).map(l => ({
      ...l,
      progress: map.get(l.slug) || null
    }))
  });
});
