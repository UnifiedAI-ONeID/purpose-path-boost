import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';
import { strictFetch } from '../../_util/strictFetch';
import { getCache, setCache } from '../../_util/cache';

const AI_ENABLE = true;
const AI_TIMEOUT = 6000;
const AI_CACHE_TTL = 900;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  
  try {
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { country, base_price_cents, base_currency, ticket_id } = (req.method === 'POST' ? req.body : req.query) as any;
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Check cache
    const cacheKey = `pricing:${ticket_id}:${country}:${base_price_cents}`;
    const cached = getCache(cacheKey, AI_CACHE_TTL);
    if (cached) {
      return res.status(200).json({ ok: true, source: 'cache', heur: cached });
    }

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

    const heuristic: any = {
      suggest_cents: Math.round(localPrice / 100) * 100 - 1,
      currency: targetCurrency,
      reasoning: `PPP adjustment (${(ppp * 100).toFixed(0)}%) + FX conversion`,
    };

    // Check if CN or AI disabled
    const host = req.headers.host || '';
    const edgeCountry = (req.headers['x-edge-country'] || '').toString().toUpperCase();
    const isCN = edgeCountry === 'CN' || host.endsWith('.cn');
    
    if (!isCN && AI_ENABLE && process.env.GOOGLE_AI_API_KEY) {
      try {
        const prompt = `Suggest optimal local price for a life coaching session priced at ${base_currency} ${(base_price_cents / 100).toFixed(2)} in ${country}. 
Return JSON with: 
- suggest_cents (number): recommended price in cents with .99 ending
- currency (string): target currency code
- reasoning (string): brief explanation of pricing strategy
- tiers (array): low/sweet/premium price options

Consider local purchasing power, market positioning, and psychological pricing.`;
        
        const r = await strictFetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          },
          AI_TIMEOUT
        ).then(r => r.json());

        const text = r?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.suggest_cents && parsed.reasoning) {
            heuristic.suggest_cents = parsed.suggest_cents;
            heuristic.reasoning = parsed.reasoning;
            heuristic.ai = text;
            heuristic.source = 'google';
            if (parsed.tiers) heuristic.tiers = parsed.tiers;
          }
        }

        // Log AI usage
        await supabase.from('ai_logs').insert([{
          route: '/api/admin/pricing/suggest',
          mode: 'google',
          request: { country, base_price_cents, base_currency },
          duration_ms: Date.now() - startTime
        }]);
      } catch (aiError: any) {
        console.error('AI error:', aiError);
        await supabase.from('ai_logs').insert([{
          route: '/api/admin/pricing/suggest',
          mode: 'heuristic',
          request: { country, base_price_cents, base_currency },
          error: aiError.message,
          duration_ms: Date.now() - startTime
        }]);
      }
    }

    setCache(cacheKey, heuristic);
    res.status(200).json({ ok: true, source: heuristic.source || 'heuristic', heur: heuristic });
  } catch (e: any) {
    console.error('Pricing suggestion error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
