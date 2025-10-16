import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const slug = (req.query.slug as string) || req.body?.slug;
    const name = (req.query.name as string) || req.body?.name || '';
    const email = (req.query.email as string) || req.body?.email || '';

    if (!slug) {
      return res.status(400).json({ ok: false, error: 'Missing slug parameter' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      utm_campaign: slug
    });

    const url = `https://cal.com/${team}/${offer.cal_event_type_slug}?${params.toString()}`;

    return res.status(200).json({ ok: true, url });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
