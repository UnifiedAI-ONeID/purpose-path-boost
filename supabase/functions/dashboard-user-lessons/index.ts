import { json, qs, corsHeaders } from '../_shared/utils.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    // Get user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('zg_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return json({ ok: false, error: 'Profile not found' }, 404);
    }

    const pid = profile.id;
    const tags = (qs(req).get('tags') || '').split(',').filter(Boolean);
    const s = supabase;

    // Get assigned lessons
    const { data: assigned } = await s
      .from('lesson_assignments')
      .select('lesson_slug, order_index')
      .in('tag', tags.length ? tags : ['_all_'])
      .order('order_index');

    const slugs = (assigned || []).map(x => x.lesson_slug);

    // Get lessons
    let { data: lessons } = await s
      .from('lessons')
      .select('slug, title_en, summary_en, poster_url, yt_id, duration_sec, tags, order_index, cn_alt_url, captions_vtt_url, published')
      .eq('published', true)
      .order('order_index');

    if (slugs.length) {
      lessons = (lessons || [])
        .filter(l => slugs.includes(l.slug))
        .sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
    }

    // Get progress
    const { data: prog } = await s
      .from('lesson_progress')
      .select('lesson_slug, completed, last_position_sec')
      .eq('profile_id', pid);

    const map = new Map((prog || []).map(p => [p.lesson_slug, p]));

    return json({
      ok: true,
      rows: (lessons || []).map(l => ({
        ...l,
        progress: map.get(l.slug) || null
      }))
    });
  } catch (error: any) {
    console.error('[dashboard-user-lessons] Error:', error);
    return json({ ok: false, error: 'Failed to fetch lessons' }, 500);
  }
});
