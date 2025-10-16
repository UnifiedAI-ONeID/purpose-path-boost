import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getLang, pickFields } from '../_util/i18n';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const slug = (req.query.slug as string) || req.body?.slug;

    if (!slug) {
      return res.status(400).json({ ok: false, error: 'Missing slug parameter' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const lang = getLang(req);
    res.setHeader('Vary', 'Accept-Language');

    // Get offer
    const { data: offer, error: offerError } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (offerError || !offer) {
      return res.status(404).json({ ok: false, error: 'Offer not found' });
    }

    // Get page content
    const { data: page } = await supabase
      .from('coaching_pages')
      .select('*')
      .eq('offer_slug', slug)
      .maybeSingle();

    // Provide both raw data and localized fields
    const localized = pickFields({ ...offer, ...(page || {}) }, lang);

    return res.status(200).json({ ok: true, offer, page, localized, lang });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
