import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { quoteWithBreakdown } from '../../events/_price';
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
    
    const { ticket_id, currency } = (req.method === 'POST' ? req.body : req.query) as any;
    if (!ticket_id) {
      return res.status(400).json({ ok: false, error: 'ticket_id required' });
    }

    const quote = await quoteWithBreakdown(supabase, { 
      ticket_id, 
      target_currency: currency || 'USD' 
    });

    // Include last updated timestamps for rates used
    const bases = Array.from(new Set([
      quote.steps?.fx?.via || quote.steps?.base?.currency, 
      'USD'
    ].filter(Boolean)));
    
    const rates: any = {};
    for (const base of bases) {
      const { data } = await supabase
        .from('fx_rates')
        .select('base,updated_at')
        .eq('base', base as string)
        .maybeSingle();
      
      if (data) rates[base as string] = { updated_at: data.updated_at };
    }

    return res.status(200).json({ ok: true, ...quote, rates_meta: rates });
  } catch (e: any) {
    console.error('FX inspect error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
