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

    // Get overview data
    const overviewUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/api-admin-analytics-overview`;
    const overviewRes = await fetch(overviewUrl, {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    });
    const overviewData = await overviewRes.json();

    if (!overviewData.ok) {
      return json({ ok: false, error: 'Failed to fetch overview data' }, 500);
    }

    const analytics = overviewData.analytics;

    // Generate heuristic insights
    const insights: string[] = [];

    if (analytics.lead_magnet_cr != null) {
      const pct = (analytics.lead_magnet_cr * 100).toFixed(1);
      if (analytics.lead_magnet_cr < 0.15) {
        insights.push(`Lead magnet converting at ${pct}%. Test headline & reduce form fields to lift to 20–30%.`);
      } else {
        insights.push(`Lead magnet converting well at ${pct}%. Continue A/B testing to optimize further.`);
      }
    }

    if (analytics.discovery_call_cr != null) {
      const pct = (analytics.discovery_call_cr * 100).toFixed(1);
      if (analytics.discovery_call_cr < 0.25) {
        insights.push(`Discovery-call page converting at ${pct}%. Add social proof & 2nd CTA above fold.`);
      } else {
        insights.push(`Discovery calls converting well at ${pct}%. Focus on call quality and follow-ups.`);
      }
    }

    if (analytics.mobile_cr != null) {
      const pct = (analytics.mobile_cr * 100).toFixed(1);
      if (analytics.mobile_cr < 0.15) {
        insights.push(`Mobile conversion at ${pct}%. Audit PWA speed & one-tap install prompt.`);
      } else {
        insights.push(`Mobile experience performing well at ${pct}% conversion.`);
      }
    }

    if (analytics.sources?.length > 0) {
      const topSource = analytics.sources[0];
      insights.push(`Top source "${topSource.source}": ${topSource.sessions} sessions. Scale best posts, replicate format.`);
    }

    if (analytics.avg_session_min != null) {
      if (analytics.avg_session_min < 1) {
        insights.push(`Avg session ${analytics.avg_session_min.toFixed(1)}min. Add short video teasers to increase engagement to 1–3min+.`);
      } else {
        insights.push(`Good session duration at ${analytics.avg_session_min.toFixed(1)}min. Users are engaged with content.`);
      }
    }

    if (analytics.lead_to_client != null && analytics.lead_to_client > 0) {
      const pct = (analytics.lead_to_client * 100).toFixed(1);
      insights.push(`Lead-to-client conversion: ${pct}%. Focus on nurturing leads with email sequences.`);
    }

    if (analytics.refunds_cents_28d > 0) {
      const amt = Math.round(analytics.refunds_cents_28d / 100);
      insights.push(`$${amt} in refunds last 28 days. Review customer feedback for service improvements.`);
    }

    return json({ ok: true, insights });
  } catch (error: any) {
    console.error('[api-admin-analytics-insights] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});
