import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCalKey } from '../_util/calKey';

const CAL_API = 'https://api.cal.com/v2';
const memCache: Record<string, { t: number; v: any }> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const slug = (req.query.slug as string) || req.body?.slug;
    const team = process.env.CALCOM_TEAM || 'zhengrowth';
    const tz = (req.query.tz as string) || req.body?.tz || 'America/Vancouver';
    const days = Math.min(+(req.query.days as string || req.body?.days || 14), 30);

    if (!slug) {
      return res.status(400).json({ ok: false, error: 'Missing slug parameter' });
    }

    // Check 60s memory cache
    const cacheKey = `${slug}:${tz}:${days}`;
    const cached = memCache[cacheKey];
    const now = Date.now();
    
    if (cached && now - cached.t < 60 * 1000) {
      return res.status(200).json({ ok: true, source: 'cache', ...cached.v });
    }

    const token = await getCalKey();

    // Fetch availability from Cal.com
    const url = `${CAL_API}/event-types/${encodeURIComponent(slug)}/availability?timezone=${encodeURIComponent(tz)}&days=${days}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.status}`);
    }

    const json = await response.json();
    const slots = normalizeSlots(json);

    const payload = { ok: true, source: 'cal', slots };
    memCache[cacheKey] = { t: now, v: payload };

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('Availability error:', error);
    return res.status(200).json({ ok: false, error: error.message, slots: [] });
  }
}

function normalizeSlots(apiResponse: any) {
  const raw = apiResponse?.data || apiResponse?.slots || [];
  return raw.slice(0, 60).map((slot: any) => ({
    start: slot.start || slot.startTime,
    end: slot.end || slot.endTime
  }));
}
