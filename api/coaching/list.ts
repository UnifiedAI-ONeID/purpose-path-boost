import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('coaching_offers')
      .select('slug, title_en, title_zh_cn, title_zh_tw, summary_en, summary_zh_cn, summary_zh_tw, base_price_cents, base_currency, billing_type, cal_event_type_slug, active, sort')
      .eq('active', true)
      .order('sort', { ascending: true });

    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, rows: data || [] });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
