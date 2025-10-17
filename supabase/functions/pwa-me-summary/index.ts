import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const device = url.searchParams.get('device');

    if (!device) {
      return new Response(
        JSON.stringify({ error: 'Device ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching summary for device:', device);

    // Get or create profile
    const { data: profile } = await supabase
      .from('zg_profiles')
      .select('id, email, name')
      .eq('device_id', device)
      .maybeSingle();

    let profileId = profile?.id;

    if (!profileId) {
      // Create profile for new device
      const { data: newProfile, error: createError } = await service
        .from('zg_profiles')
        .insert([{ device_id: device }])
        .select('id')
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return new Response(
          JSON.stringify({ ok: true, profile: null, next: null, goals: [], receipts: [], streak: 0, ref_url: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profileId = newProfile.id;
    }

    const now = new Date().toISOString();

    // Fetch all data in parallel
    const [sessionsResult, goalsResult, receiptsResult, refResult] = await Promise.all([
      supabase
        .from('me_sessions')
        .select('*')
        .eq('profile_id', profileId)
        .gte('start_at', now)
        .order('start_at', { ascending: true })
        .limit(1),
      supabase
        .from('me_goals')
        .select('*')
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('me_receipts')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('zg_referrals')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle()
    ]);

    // Calculate streak
    const { data: streakData } = await supabase
      .rpc('get_user_streak', { p_profile_id: profileId })
      .maybeSingle();

    const nextSession = sessionsResult.data?.[0] || null;
    const ref_url = refResult.data?.ref_code 
      ? `https://zhengrowth.com/?ref=${encodeURIComponent(refResult.data.ref_code)}` 
      : null;

    return new Response(
      JSON.stringify({
        ok: true,
        profile: profile ? { 
          id: profile.id, 
          name: profile.name, 
          email: profile.email 
        } : null,
        next: nextSession,
        goals: goalsResult.data || [],
        receipts: receiptsResult.data || [],
        streak: streakData || 0,
        ref_url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in pwa-me-summary:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
