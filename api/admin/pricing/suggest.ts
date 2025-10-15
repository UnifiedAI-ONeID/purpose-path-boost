import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { country, base_price_cents, base_currency } = (req.method === 'POST' ? req.body : req.query) as any;
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data: fx } = await supabase
      .from('fx_rates')
      .select('*')
      .eq('base', base_currency)
      .maybeSingle();

    // PPP-based pricing heuristic
    const pppMap: any = { 
      CN: 0.55, HK: 1.0, TW: 0.9, SG: 1.2, 
      MY: 0.7, CA: 1.1, US: 1.0 
    };
    
    const ppp = pppMap[country] || 1.0;
    const adjustedBase = base_price_cents * ppp;
    const targetCurrency = country === 'CN' ? 'CNY' : base_currency;
    const fxRate = fx?.rates?.[targetCurrency] || 1;
    const localPrice = Math.round(adjustedBase * fxRate);

    const heuristic = {
      suggest_cents: Math.round(localPrice / 100) * 100 - 1,
      currency: targetCurrency,
      reasoning: `PPP adjustment (${(ppp * 100).toFixed(0)}%) + FX conversion`,
    };

    res.status(200).json({ ok: true, heur: heuristic });
  } catch (e: any) {
    console.error('Pricing suggestion error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
