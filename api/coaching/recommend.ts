import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type Lang = 'en' | 'zh-CN' | 'zh-TW';

function getLang(req: any): Lang {
  const q = (req.query?.lang || req.body?.lang || '').toString();
  if (q === 'zh-CN' || q === 'zh-TW' || q === 'en') return q as Lang;
  
  const al = (req.headers['accept-language'] || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  
  return 'en';
}

function pickFields(row: any, lang: Lang) {
  const title = lang === 'zh-CN' 
    ? (row.title_zh_cn ?? row.title_en)
    : lang === 'zh-TW' 
    ? (row.title_zh_tw ?? row.title_en)
    : row.title_en;

  const summary = lang === 'zh-CN'
    ? (row.summary_zh_cn ?? row.summary_en)
    : lang === 'zh-TW'
    ? (row.summary_zh_tw ?? row.summary_en)
    : row.summary_en;

  return { title, summary };
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  const lang = getLang(req);
  const tags = (req.method === 'POST' ? req.body?.tags : req.query?.tags) as string[] || [];

  const { data: offers } = await s
    .from('coaching_offers')
    .select('*')
    .eq('active', true);

  // Score offers based on tag matching
  const scored = (offers || []).map(o => {
    const offerTags = o.tags || [];
    const score = offerTags.reduce((sum: number, t: string) => {
      if (tags.includes(t)) return sum + 2; // Exact match
      if (tags.some(x => t.includes(x) || x.includes(t))) return sum + 1; // Partial match
      return sum;
    }, 0);
    
    const localized = pickFields(o, lang);
    return { ...o, score, ...localized };
  }).sort((a, b) => b.score - a.score || a.sort - b.sort);

  res.status(200).json({
    ok: true,
    rows: scored.slice(0, 6),
    lang,
    tags
  });
};
