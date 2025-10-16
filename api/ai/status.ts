import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AI, EDGE_COUNTRY_HEADER } from '../../src/lib/ai-config';

export default async (req: VercelRequest, res: VercelResponse) => {
  const country = (req.headers[EDGE_COUNTRY_HEADER] || '').toString().toUpperCase();
  const host = req.headers.host || '';
  const cn = AI.isCN(host, country);
  const hasKey = !!process.env.GOOGLE_AI_API_KEY;
  
  res.status(200).json({ 
    ok: true, 
    ai_enabled: AI.ENABLE, 
    has_key: hasKey, 
    cn_mode: cn, 
    timeout_ms: AI.TIMEOUT, 
    cache_ttl_s: AI.CACHE_TTL 
  });
};
