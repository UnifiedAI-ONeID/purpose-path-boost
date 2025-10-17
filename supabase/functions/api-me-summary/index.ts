import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const device = url.searchParams.get('device') || req.headers.get('x-zg-device') || '';
    
    if (!device) {
      return jsonResponse({ ok: false, error: 'device_id required' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get profile
    const { data: profile } = await supabase
      .from('zg_profiles')
      .select('*')
      .eq('device_id', device)
      .maybeSingle();

    if (!profile) {
      return jsonResponse({ ok: false, error: 'profile not found' }, 200);
    }

    // Get referral code
    let { data: refData } = await supabase
      .from('zg_referrals')
      .select('ref_code')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!refData) {
      const ref_code = crypto.randomUUID().substring(0, 8).toUpperCase();
      const { data: newRef, error: insertErr } = await supabase
        .from('zg_referrals')
        .insert({ profile_id: profile.id, ref_code })
        .select()
        .maybeSingle();
      
      if (insertErr) {
        console.error('[api-me-summary] Referral insert error:', insertErr);
      }
      refData = newRef;
    }

    // Get next session from cal_bookings
    const { data: nextSession } = await supabase
      .from('cal_bookings')
      .select('*')
      .eq('attendee_email', profile.email || '')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Calculate streak (simplified: count events in last 30 days)
    const { count } = await supabase
      .from('zg_events')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const streak_pct = Math.min(100, (count || 0) * 3.33); // ~30 events = 100%

    const origin = req.headers.get('origin') || 'https://zhengrowth.com';

    return jsonResponse({
      ok: true,
      next: nextSession ? {
        start: nextSession.start_time,
        join_url: nextSession.meeting_url
      } : null,
      streak_pct,
      ref_url: `${origin}?ref=${refData?.ref_code}`,
      profile
    }, 200);
  } catch (error) {
    console.error('[api-me-summary] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
