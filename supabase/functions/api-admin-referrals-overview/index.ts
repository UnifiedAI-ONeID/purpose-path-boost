import { json, sbSrv, corsHeaders } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin } = await requireAdmin(req.headers.get('authorization'));
    if (!isAdmin) {
      return json({ ok: false, error: 'Admin access required' }, 403);
    }

    const s = sbSrv();

    // Get referral settings
    const { data: settings, error: settingsError } = await s
      .from('referral_settings')
      .select('*')
      .single();

    if (settingsError) throw settingsError;

    // Get top referrers
    const { data: leaderboard, error: leaderboardError } = await s.rpc('get_top_referrers');

    if (leaderboardError) {
      console.error('[api-admin-referrals-overview] Leaderboard error:', leaderboardError);
    }

    return json({ 
      ok: true, 
      settings: settings || { friend_percent_off: 20, referrer_percent_off: 20, coupon_expiry_days: 7 },
      leaderboard: leaderboard || [] 
    });
  } catch (error: any) {
    console.error('[api-admin-referrals-overview] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
