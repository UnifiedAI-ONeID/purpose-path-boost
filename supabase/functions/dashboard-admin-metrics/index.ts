import { json, sbSrv, corsHeaders } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const { isAdmin } = await requireAdmin(req.headers.get('authorization'));
    if (!isAdmin) {
      return json({ ok: false, error: 'Admin access required' }, 403);
    }

    const s = sbSrv();

    // Get KPI metrics
    const [mrrResult, activeResult, dauResult, mauResult, completes30Result, bookings30Result] = await Promise.all([
      s.rpc('calc_mrr'),
      s.from('coaching_offers').select('id', { count: 'exact', head: true }).eq('active', true).eq('billing_type', 'subscription'),
      s.rpc('calc_dau'),
      s.rpc('calc_mau'),
      s.from('lesson_events').select('id', { count: 'exact', head: true }).eq('ev', 'complete').gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString()),
      s.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString())
    ]);

    // Get funnel data
    const { data: funnel } = await s.rpc('calc_funnel_30d');

    // Get content leaderboard
    const { data: content } = await s.rpc('content_leaderboard_30d');

    // Get recent referrals
    const { data: referrals } = await s
      .from('referrals')
      .select('code, status, created_at, converted_at')
      .gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString())
      .order('created_at', { ascending: false })
      .limit(15);

    // Get webhook health (recent events)
    const { data: webhooks } = await s
      .from('events_raw')
      .select('event, ts, meta')
      .in('event', ['awx_webhook_ok', 'awx_webhook_err', 'cal_webhook_ok', 'cal_webhook_err'])
      .order('ts', { ascending: false })
      .limit(20);

    return json({
      ok: true,
      kpi: {
        mrr: mrrResult.data?.[0]?.amount_cents || 0,
        active: activeResult.count || 0,
        dau: dauResult.data?.[0]?.n || 0,
        mau: mauResult.data?.[0]?.n || 0,
        completes30: completes30Result.count || 0,
        bookings30: bookings30Result.count || 0
      },
      revenue: [], // Placeholder for revenue series
      funnel: funnel || [],
      content: content || [],
      referrals: referrals || [],
      webhooks: webhooks || []
    });
  } catch (error: any) {
    console.error('[dashboard-admin-metrics] Error:', error);
    return json({ ok: false, error: 'Failed to fetch admin metrics' }, 500);
  }
});
