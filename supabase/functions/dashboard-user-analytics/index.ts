import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const profileId = url.searchParams.get('profile_id');
    
    if (!profileId) {
      return jsonResponse({ ok: false, error: 'MISSING_PROFILE' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!
          }
        }
      }
    );

    // Helper to get start of UTC day
    function startOfUTC(days: number): string {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - days);
      return d.toISOString();
    }

    const nowISO = new Date().toISOString();
    const d7 = startOfUTC(7);
    const d30 = startOfUTC(30);

    // Fetch lesson events
    const [ev7Result, ev30Result] = await Promise.all([
      supabase
        .from('lesson_events')
        .select('ev, created_at, at_sec')
        .eq('profile_id', profileId)
        .gte('created_at', d7),
      supabase
        .from('lesson_events')
        .select('ev, created_at, at_sec')
        .eq('profile_id', profileId)
        .gte('created_at', d30)
    ]);

    const ev7 = ev7Result.data || [];
    const ev30 = ev30Result.data || [];

    // Calculate completion rate
    const completes30 = ev30.filter(e => e.ev === 'complete').length;
    const starts30 = ev30.filter(e => e.ev === 'start').length;
    const completionRate = starts30 ? Math.round((completes30 / starts30) * 100) : 0;

    // Calculate focus time from watch ticks
    const ticks7 = ev7.filter(e => e.ev === 'watch_tick').map(e => Number(e.at_sec || 0));
    const ticks30 = ev30.filter(e => e.ev === 'watch_tick').map(e => Number(e.at_sec || 0));

    function estimateMinutes(arr: number[]): number {
      if (arr.length < 2) return 0;
      arr.sort((a, b) => a - b);
      let total = 0;
      for (let i = 1; i < arr.length; i++) {
        const delta = arr[i] - arr[i - 1];
        if (delta > 0 && delta < 600) total += delta;
      }
      return Math.round(total / 60);
    }

    const minutes7 = estimateMinutes(ticks7);
    const minutes30 = estimateMinutes(ticks30);

    // Calculate streak
    const all30 = ev30.map(e => new Date(e.created_at).toISOString().slice(0, 10));
    const activeDays = new Set(all30);
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      if (activeDays.has(dayKey)) {
        streak++;
      } else {
        break;
      }
    }

    // Get bookings this month
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString();

    const { data: sessions } = await supabase
      .from('me_sessions')
      .select('status')
      .eq('profile_id', profileId)
      .gte('created_at', monthStartISO);

    const booked = (sessions || []).length;
    const attended = (sessions || []).filter(s => s.status === 'attended').length;

    // Get plan info and usage
    const { data: planView } = await supabase
      .from('v_profile_plan')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    const features = planView?.features || { videos_per_month: 3, all_access: false };
    const periodStart = planView?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: usageData } = await supabase
      .from('lesson_usage')
      .select('watch_count')
      .eq('profile_id', profileId)
      .eq('period_start', periodStart)
      .maybeSingle();

    const limit = features.all_access ? Infinity : Number(features.videos_per_month || 3);
    const used = usageData?.watch_count || 0;
    const remaining = !isFinite(limit) ? null : Math.max(0, limit - used);

    // Get referral impact
    const { data: referrals } = await supabase
      .from('zg_referrals')
      .select('status')
      .eq('profile_id', profileId)
      .gte('created_at', startOfUTC(90));

    const invited = (referrals || []).length;
    const converted = (referrals || []).filter(r => 
      r.status === 'rewarded' || r.status === 'converted'
    ).length;

    // Calculate habits score (0-100)
    const streakScore = Math.min(streak, 7) / 7 * 40;
    const minutesScore = Math.min(minutes7, 120) / 120 * 30;
    const completeScore = completionRate / 100 * 30;
    const habits = Math.round(streakScore + minutesScore + completeScore);

    // Determine next best action
    let nba = { title: '', cta: '', href: '', reason: '' };
    
    if (remaining !== null && remaining === 0) {
      nba = {
        title: 'Unlock more lessons',
        cta: 'See plans',
        href: '/pricing',
        reason: "You've reached your monthly limit."
      };
    } else if (booked === 0) {
      nba = {
        title: 'Book your first session',
        cta: 'Schedule now',
        href: '/coaching',
        reason: '1:1 sessions accelerate results.'
      };
    } else if (completionRate < 50 && starts30 >= 3) {
      nba = {
        title: 'Finish what you started',
        cta: 'Resume lesson',
        href: '/me',
        reason: 'Boost momentum with quick wins.'
      };
    } else if (invited === 0 && habits >= 60) {
      nba = {
        title: 'Invite a friend',
        cta: 'Share & get rewards',
        href: '/me',
        reason: 'Friends learn better together.'
      };
    } else {
      nba = {
        title: 'Keep the streak',
        cta: 'Resume learning',
        href: '/me',
        reason: 'Consistency compounds results.'
      };
    }

    return jsonResponse({
      ok: true,
      streak,
      minutes: { d7: minutes7, d30: minutes30 },
      completion: { starts30, completes30, rate: completionRate },
      bookings: { month: { booked, attended } },
      plan: {
        slug: planView?.plan_slug || 'free',
        remaining,
        window: { start: periodStart, end: planView?.period_end }
      },
      referrals: { invited, converted },
      habits,
      next_best_action: nba,
      now: nowISO
    }, 200);
  } catch (error) {
    console.error('[dashboard-user-analytics] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
