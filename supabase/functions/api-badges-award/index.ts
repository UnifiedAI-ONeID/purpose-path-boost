import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const { profile_id } = await req.json();
    
    if (!profile_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing profile_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for streak badge (7+ days)
    const { data: streakData, error: streakError } = await supabase
      .rpc('get_user_streak', { p_profile_id: profile_id });
    
    const streakCount = typeof streakData === 'number' ? streakData : 0;
    
    if (streakCount >= 7) {
      await supabase
        .from('profile_badges')
        .upsert({ profile_id, badge_code: 'streak_7' }, { onConflict: 'profile_id,badge_code' });
    }

    // Check for first booking
    const { count } = await supabase
      .from('me_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile_id);
    
    if ((count || 0) >= 1) {
      await supabase
        .from('profile_badges')
        .upsert({ profile_id, badge_code: 'first_booking' }, { onConflict: 'profile_id,badge_code' });
    }

    // Check for all access
    const { data: plan } = await supabase
      .from('v_profile_plan')
      .select('plan_slug')
      .eq('profile_id', profile_id)
      .maybeSingle();
    
    if (plan && ['growth', 'pro'].includes(plan.plan_slug)) {
      await supabase
        .from('profile_badges')
        .upsert({ profile_id, badge_code: 'all_access' }, { onConflict: 'profile_id,badge_code' });
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Badge award error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
