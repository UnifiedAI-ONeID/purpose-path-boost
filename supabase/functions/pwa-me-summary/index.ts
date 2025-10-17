import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

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
      return jsonResponse({ ok: false, error: 'Device ID required' }, 200);
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
        .maybeSingle();

      if (createError) {
        console.error('[pwa-me-summary] Profile creation error:', createError);
        return jsonResponse({ 
          ok: true, 
          profile: null, 
          next: null, 
          goals: [], 
          receipts: [], 
          streak: 0, 
          ref_url: null 
        }, 200);
      }

      if (!newProfile) {
        console.error('[pwa-me-summary] Profile creation returned no data');
        return jsonResponse({ 
          ok: true, 
          profile: null, 
          next: null, 
          goals: [], 
          receipts: [], 
          streak: 0, 
          ref_url: null 
        }, 200);
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

    return jsonResponse({
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
    }, 200);
  } catch (error) {
    console.error('[pwa-me-summary] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
