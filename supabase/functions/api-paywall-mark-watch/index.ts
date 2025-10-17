import { json, readJson, bad, sbAnon, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return new Response(null, { status: 405 });

  const { profile_id, lesson_slug } = await readJson(req);
  if (!profile_id || !lesson_slug) return bad();

  const s = sbAnon(req);

  // Get plan period
  const plan = await s
    .from('v_profile_plan')
    .select('*')
    .eq('profile_id', profile_id)
    .maybeSingle();

  const start = plan.data?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Check if this lesson was already counted this period
  const first = await s
    .from('lesson_events')
    .select('id')
    .eq('profile_id', profile_id)
    .eq('lesson_slug', lesson_slug)
    .gte('created_at', start)
    .limit(1);

  if (first.data?.length) {
    return json({ ok: true, counted: false });
  }

  // Increment usage
  await s.rpc('increment_lesson_usage', {
    p_profile: profile_id,
    p_start: start
  });

  return json({ ok: true, counted: true });
});
