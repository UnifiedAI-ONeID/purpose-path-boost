import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getLang, pickFields } from './_util/i18n';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ ok: false, error: 'Missing Supabase configuration', rows: [] });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const lang = getLang(req);
  res.setHeader('Vary', 'Accept-Language');

  const { data, error } = await supabase
    .from('coaching_offers')
    .select('*')
    .eq('active', true)
    .order('sort', { ascending: true });

  if (error) {
    return res.status(200).json({ ok: false, error: error.message, rows: [] });
  }

  const rows = (data || []).map(offer => {
    const localized = pickFields({
      ...offer,
      body_html_en: offer.summary_en,
      body_html_zh_cn: offer.summary_zh_cn,
      body_html_zh_tw: offer.summary_zh_tw
    }, lang);
    return { ...offer, localized };
  });

  return res.status(200).json({ ok: true, rows, lang });
}
