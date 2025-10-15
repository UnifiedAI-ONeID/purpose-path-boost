import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Admin authentication
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const { event_id, ticket_id, country, currency } = req.body || {};

    // Input validation
    if (!event_id || !ticket_id || !country) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // Fetch test results from the stats view using Supabase client methods
    // SECURITY: Never use raw SQL - always use the Supabase client
    const { data: stats, error: statsError } = await supabase
      .from('v_price_test_stats')
      .select('variant, price_cents, currency, conv_rate_pct, revenue_cents')
      .eq('event_id', event_id)
      .eq('ticket_id', ticket_id)
      .eq('region', country)
      .order('conv_rate_pct', { ascending: false, nullsFirst: false })
      .order('revenue_cents', { ascending: false, nullsFirst: false })
      .limit(1);

    if (statsError) throw statsError;

    if (!stats || stats.length === 0) {
      return res.status(400).json({ ok: false, error: 'No test results yet' });
    }

    const winner = stats[0];

    // 1) Write override to winner price
    const { error: upsertError } = await supabase
      .from('event_ticket_fx_overrides')
      .upsert({
        ticket_id,
        currency: (winner.currency || currency || 'USD').toUpperCase(),
        price_cents: winner.price_cents
      });

    if (upsertError) throw upsertError;

    // 2) End active tests in this region
    const { error: endError } = await supabase
      .from('event_price_tests')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('ticket_id', ticket_id)
      .eq('region', country)
      .eq('is_active', true);

    if (endError) throw endError;

    return res.status(200).json({ ok: true, winner });
  } catch (e: any) {
    console.error('Adopt winner error:', e);
    return res.status(400).json({ ok: false, error: e.message });
  }
}
