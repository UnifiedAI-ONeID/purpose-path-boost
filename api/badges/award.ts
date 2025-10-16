import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { profile_id } = body || {};
  
  if (!profile_id) {
    return new Response(JSON.stringify({ ok: false, error: 'missing profile_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check for streak badge (7+ days)
  const { data: streakData } = await supabase
    .rpc('get_user_streak', { p_profile_id: profile_id })
    .single();
  
  if ((streakData || 0) >= 7) {
    await supabase
      .from('profile_badges')
      .insert([{ profile_id, badge_code: 'streak_7' }])
      .onConflict('profile_id,badge_code')
      .ignore();
  }

  // Check for first booking (me_sessions exists)
  const { count } = await supabase
    .from('me_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile_id);
  
  if ((count || 0) >= 1) {
    await supabase
      .from('profile_badges')
      .insert([{ profile_id, badge_code: 'first_booking' }])
      .onConflict('profile_id,badge_code')
      .ignore();
  }

  // Check for all access (subscription plan growth/pro)
  const { data: plan } = await supabase
    .from('v_profile_plan')
    .select('plan_slug')
    .eq('profile_id', profile_id)
    .maybeSingle();
  
  if (plan && ['growth', 'pro'].includes(plan.plan_slug)) {
    await supabase
      .from('profile_badges')
      .insert([{ profile_id, badge_code: 'all_access' }])
      .onConflict('profile_id,badge_code')
      .ignore();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
