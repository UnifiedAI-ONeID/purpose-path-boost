import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

function mkCents(n: number) { 
  return Math.max(0, Math.round(n)); 
}

function applyPercent(n: number, p: number) { 
  return n * (1 + p); 
}

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

    const { 
      event_id, 
      ticket_id, 
      country, 
      currency, 
      suggest_cents, 
      spread_pct = 0.10 
    } = req.body || {};

    // Input validation
    if (!event_id || !ticket_id || !country || !currency || !suggest_cents) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    if (suggest_cents < 0) {
      return res.status(400).json({ ok: false, error: 'Invalid price' });
    }

    if (spread_pct < 0 || spread_pct > 1) {
      return res.status(400).json({ ok: false, error: 'Invalid spread_pct (must be 0-1)' });
    }

    // 1) Create/Update per-currency override at suggested price
    const { error: upsertError } = await supabase
      .from('event_ticket_fx_overrides')
      .upsert({
        ticket_id,
        currency: currency.toUpperCase(),
        price_cents: suggest_cents
      });

    if (upsertError) throw upsertError;

    // 2) Calculate A/B/C variants around suggested price
    const base = Number(suggest_cents);
    const low = mkCents(applyPercent(base, -Math.abs(spread_pct)));  // A: -10%
    const mid = base;                                                  // B: baseline
    const high = mkCents(applyPercent(base, Math.abs(spread_pct)));   // C: +10%

    // 3) Deactivate any active tests for this ticket + region
    const { error: deactivateError } = await supabase
      .from('event_price_tests')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('ticket_id', ticket_id)
      .eq('region', country)
      .eq('is_active', true);

    if (deactivateError) throw deactivateError;

    // 4) Insert new test variants
    const variants = [
      { 
        event_id, 
        ticket_id, 
        region: country, 
        variant: 'A', 
        price_cents: low, 
        currency: currency.toUpperCase(), 
        is_active: true 
      },
      { 
        event_id, 
        ticket_id, 
        region: country, 
        variant: 'B', 
        price_cents: mid, 
        currency: currency.toUpperCase(), 
        is_active: true 
      },
      { 
        event_id, 
        ticket_id, 
        region: country, 
        variant: 'C', 
        price_cents: high, 
        currency: currency.toUpperCase(), 
        is_active: true 
      }
    ];

    const { error: insertError } = await supabase
      .from('event_price_tests')
      .insert(variants);

    if (insertError) throw insertError;

    return res.status(200).json({ 
      ok: true, 
      override: { 
        currency: currency.toUpperCase(), 
        price_cents: suggest_cents 
      }, 
      variants 
    });
  } catch (e: any) {
    console.error('Apply suggestion error:', e);
    return res.status(400).json({ ok: false, error: e.message });
  }
}
