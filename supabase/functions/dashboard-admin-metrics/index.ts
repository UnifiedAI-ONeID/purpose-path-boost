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
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 864e5).toISOString();

    // Get KPI metrics in parallel
    const [
      mrrResult, 
      activeResult, 
      dauResult, 
      mauResult, 
      completes30Result, 
      bookings30Result,
      leads30Result,
      funnelResult,
      contentResult
    ] = await Promise.all([
      s.rpc('calc_mrr'),
      s.from('coaching_offers').select('id', { count: 'exact', head: true }).eq('active', true).eq('billing_type', 'subscription'),
      s.rpc('calc_dau'),
      s.rpc('calc_mau'),
      s.from('lesson_events').select('id', { count: 'exact', head: true }).eq('ev', 'complete').gte('created_at', thirtyDaysAgo),
      s.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      s.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      s.rpc('calc_funnel_30d'),
      s.rpc('content_leaderboard_30d')
    ]);

    // Parse funnel data into structured object
    const funnelData = funnelResult.data || [];
    const funnel = {
      sessions: funnelData.find((f: any) => f.stage === 'visitors')?.count || 0,
      leads: funnelData.find((f: any) => f.stage === 'leads')?.count || 0,
      calls: funnelData.find((f: any) => f.stage === 'bookings')?.count || 0,
      clients: funnelData.find((f: any) => f.stage === 'paid')?.count || 0
    };

    // Calculate conversion rate (leads to clients)
    const conversionRate = funnel.leads > 0 ? funnel.clients / funnel.leads : 0;

    // Get system alerts
    const { data: alertsData } = await s
      .from('nudge_inbox')
      .select('id, title, body')
      .is('profile_id', null)
      .eq('kind', 'banner')
      .gte('expire_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    const alerts = (alertsData || []).map((a: any) => ({
      id: a.id,
      text: a.body || a.title
    }));

    return json({
      ok: true,
      kpi: {
        mrr: mrrResult.data?.[0]?.amount_cents || 0,
        active: activeResult.count || 0,
        dau: dauResult.data?.[0]?.n || 0,
        mau: mauResult.data?.[0]?.n || 0,
        completes30: completes30Result.count || 0,
        bookings30: bookings30Result.count || 0,
        leads30: leads30Result.count || 0,
        conversion_rate: conversionRate
      },
      funnel,
      top_content: contentResult.data || [],
      alerts
    });
  } catch (error: any) {
    console.error('[dashboard-admin-metrics] Error:', error);
    return json({ ok: false, error: 'Failed to fetch admin metrics' }, 500);
  }
});
