import { json, corsHeaders } from '../_shared/utils.ts';
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
    const s = supabase;

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
