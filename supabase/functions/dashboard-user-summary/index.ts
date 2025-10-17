import { json, sbAnon, qs, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pid = qs(req).get('profile_id');
    if (!pid) return json({ ok: false, error: 'Missing profile_id' }, 400);

    const s = sbAnon(req);

    // Get plan info
    const { data: plan } = await s
      .from('v_profile_plan')
      .select('*')
      .eq('profile_id', pid)
      .maybeSingle();

    const features: any = plan?.features || { videos_per_month: 3, all_access: false };
    const start = plan?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Get usage
    const { data: usage } = await s
      .from('lesson_usage')
      .select('watch_count')
      .eq('profile_id', pid)
      .eq('period_start', start)
      .maybeSingle();

    const remaining = (features.all_access ? 9999 : Number(features.videos_per_month || 3)) - (usage?.watch_count || 0);

    // Get badges
    const { data: badges } = await s
      .from('profile_badges')
      .select('badge_code, earned_at')
      .eq('profile_id', pid)
      .order('earned_at', { ascending: false })
      .limit(3);

    // Get last activity
    const { data: lastEvent } = await s
      .from('lesson_events')
      .select('created_at')
      .eq('profile_id', pid)
      .order('created_at', { ascending: false })
      .limit(1);

    // Get next session
    const { data: nextSession } = await s
      .from('me_sessions')
      .select('*')
      .eq('profile_id', pid)
      .gte('start_at', new Date().toISOString())
      .order('start_at')
      .limit(1);

    return json({
      ok: true,
      plan: plan?.plan_slug || 'free',
      remaining,
      window: { start, end: plan?.period_end },
      badges: badges || [],
      last_activity: lastEvent?.[0]?.created_at || null,
      next_session: nextSession?.[0] || null
    });
  } catch (error: any) {
    console.error('[dashboard-user-summary] Error:', error);
    return json({ ok: false, error: 'Failed to fetch summary' }, 500);
  }
});
