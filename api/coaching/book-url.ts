import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getLang } from '../_util/i18n';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const slug = (req.query.slug as string) || req.body?.slug;
    const name = (req.query.name as string) || req.body?.name || '';
    const email = (req.query.email as string) || req.body?.email || '';
    const coupon = (req.query.coupon as string) || req.body?.coupon || '';
    const promo = (req.query.promo as string) || req.body?.promo || '';

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

    const { data: offer, error } = await supabase
      .from('coaching_offers')
      .select('cal_event_type_slug')
      .eq('slug', slug)
      .single();

    if (error || !offer) {
      return res.status(404).json({ ok: false, error: 'Offer not found' });
    }

    const team = process.env.CALCOM_TEAM || 'zhengrowth';
    const params = new URLSearchParams({
      name,
      email,
      utm_source: 'zg',
      utm_medium: 'cta',
      utm_campaign: slug,
      'metadata[lang]': lang
    });

    // Pass coupon/promo as metadata to Cal.com
    if (coupon) {
      params.append('metadata[coupon]', coupon);
    }
    if (promo) {
      params.append('metadata[promo]', promo);
    }

    const url = `https://cal.com/${team}/${offer.cal_event_type_slug}?${params.toString()}`;

    return res.status(200).json({ ok: true, url });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
