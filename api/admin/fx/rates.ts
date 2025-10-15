import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data: settings } = await supabase
      .from('pricing_settings')
      .select('*')
      .single();

    const { data: rates } = await supabase
      .from('fx_rates')
      .select('base, updated_at');

    const ratesMap: any = {};
    if (rates) {
      rates.forEach((r: any) => {
        ratesMap[r.base] = { updated_at: r.updated_at };
      });
    }

    res.status(200).json({ 
      ok: true, 
      settings: settings || {}, 
      rates: ratesMap 
    });
  } catch (e: any) {
    console.error('FX rates fetch error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
