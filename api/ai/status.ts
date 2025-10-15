import type { VercelRequest, VercelResponse } from '@vercel/node';

const AI_ENABLE = true;
const AI_TIMEOUT = 6000;
const AI_CACHE_TTL = 900;
const CN_DOMAINS = ['zhengrowth.cn', 'cn.zhengrowth.com'];

export default async (req: VercelRequest, res: VercelResponse) => {
  const country = (req.headers['x-edge-country'] || '').toString().toUpperCase();
  const host = req.headers.host || '';
  const cn = country === 'CN' || CN_DOMAINS.some(d => host.endsWith(d));
  const hasKey = !!process.env.GOOGLE_AI_API_KEY;
  
  res.status(200).json({ 
    ok: true, 
    ai_enabled: AI_ENABLE, 
    has_key: hasKey, 
    cn_mode: cn, 
    timeout_ms: AI_TIMEOUT, 
    cache_ttl_s: AI_CACHE_TTL 
  });
};
