import { json, corsHeaders } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { sbSrv } from '../_shared/utils.ts';

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
    const since = new Date(Date.now() - 28 * 864e5).toISOString();

    // Get analytics data
    const [events, leads, bookings, refunds] = await Promise.all([
      s.from('analytics_events')
        .select('*')
        .gte('created_at', since),
      s.from('leads')
        .select('id, created_at')
        .gte('created_at', since),
      s.from('bookings')
        .select('id, created_at, amount_cents, payment_status')
        .gte('created_at', since),
      s.from('bookings')
        .select('amount_cents')
        .gte('created_at', since)
        .eq('payment_status', 'refunded'),
    ]);

    const eventsData = events.data || [];
    const leadsData = leads.data || [];
    const bookingsData = bookings.data || [];
    const refundsData = refunds.data || [];

    // Calculate sessions
    const sessionIds = new Set(eventsData.map((e: any) => e.session_id).filter(Boolean));
    const sessions_28d = sessionIds.size;

    // Calculate average session duration
    const sessionDurations = new Map();
    eventsData.forEach((e: any) => {
      const sid = e.session_id;
      if (!sid) return;
      if (!sessionDurations.has(sid)) {
        sessionDurations.set(sid, { start: e.created_at, end: e.created_at });
      } else {
        const existing = sessionDurations.get(sid);
        if (e.created_at < existing.start) existing.start = e.created_at;
        if (e.created_at > existing.end) existing.end = e.created_at;
      }
    });

    let totalDuration = 0;
    sessionDurations.forEach((v) => {
      const dur = new Date(v.end).getTime() - new Date(v.start).getTime();
      totalDuration += dur;
    });
    const avg_session_min = sessionDurations.size > 0
      ? totalDuration / sessionDurations.size / 60000
      : 0;

    // Calculate conversions
    const leads_28d = leadsData.length;
    const calls_28d = bookingsData.length;
    const paidBookings = bookingsData.filter((b: any) => b.payment_status === 'paid');
    const clients_28d = paidBookings.length;

    // Calculate conversion rates
    const lead_magnet_cr = sessions_28d > 0 ? leads_28d / sessions_28d : 0;
    const discovery_call_cr = leads_28d > 0 ? calls_28d / leads_28d : 0;
    const lead_to_client = leads_28d > 0 ? clients_28d / leads_28d : 0;

    // Calculate MRR (simplified - count active paid bookings)
    const mrr_cents = paidBookings.reduce((sum: number, b: any) => sum + (b.amount_cents || 0), 0);

    // Calculate refunds
    const refunds_cents_28d = refundsData.reduce((sum: number, r: any) => sum + (r.amount_cents || 0), 0);

    // Calculate mobile conversion (check user_agent for mobile devices)
    const mobileEvents = eventsData.filter((e: any) => 
      e.user_agent && /mobile|android|iphone|ipad/i.test(e.user_agent)
    );
    const mobileConversions = mobileEvents.filter((e: any) => 
      e.event_name === 'lead_submitted' || e.event_name === 'booking_completed'
    );
    const mobile_cr = mobileEvents.length > 0 ? mobileConversions.length / mobileEvents.length : null;

    // Top sources
    const sourceMap = new Map();
    eventsData.forEach((e: any) => {
      const source = e.properties?.utm_source || 'direct';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { sessions: 0, conversions: 0 });
      }
      sourceMap.get(source).sessions++;
      if (e.event_name === 'lead_submitted' || e.event_name === 'booking_completed') {
        sourceMap.get(source).conversions++;
      }
    });

    const sources = Array.from(sourceMap.entries())
      .map(([source, data]: [string, any]) => ({
        source,
        sessions: data.sessions,
        cr: data.sessions > 0 ? data.conversions / data.sessions : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    const analytics = {
      sessions_28d,
      avg_session_min: Math.round(avg_session_min * 10) / 10,
      leads_28d,
      calls_28d,
      clients_28d,
      lead_magnet_cr,
      discovery_call_cr,
      lead_to_client,
      mrr_cents,
      refunds_cents_28d,
      mobile_cr,
      sources,
    };

    return json({ ok: true, analytics });
  } catch (error: any) {
    console.error('[api-admin-analytics-overview] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
