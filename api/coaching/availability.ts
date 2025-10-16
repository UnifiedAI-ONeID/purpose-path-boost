import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getCalKey } from '../_util/calKey';

const CAL_API = 'https://api.cal.com/v2';
const cache: Record<string, { t: number; v: any }> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const slug = (req.query.slug as string) || req.body?.slug;
    const tz = (req.query.tz as string) || req.body?.tz || 'America/Vancouver';

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

    // Check cache
    const cacheKey = `${offer.cal_event_type_slug}:${tz}`;
    const now = Date.now();
    if (cache[cacheKey] && now - cache[cacheKey].t < 60000) {
      return res.status(200).json(cache[cacheKey].v);
    }

    const token = await getCalKey();
    const url = `${CAL_API}/event-types/${encodeURIComponent(offer.cal_event_type_slug)}/availability?timezone=${encodeURIComponent(tz)}&days=14`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const json = await response.json();
    const slots = (json?.data || []).slice(0, 60);
    
    const result = { ok: true, slots };
    cache[cacheKey] = { t: now, v: result };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Availability error:', error);
    return res.status(200).json({ ok: false, error: error.message, slots: [] });
  }
}
