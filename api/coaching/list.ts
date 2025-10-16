import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type Lang = 'en' | 'zh-CN' | 'zh-TW';

// Helper to detect language from request
function getLang(req: any): Lang {
  const q = (req.query?.lang || req.body?.lang || '').toString();
  if (q === 'zh-CN' || q === 'zh-TW' || q === 'en') return q as Lang;
  
  const al = (req.headers['accept-language'] || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  
  return 'en';
}

// Helper to extract localized fields
function pickFields(row: any, lang: Lang) {
  const title = lang === 'zh-CN' 
    ? (row.title_zh_cn || row.title_en)
    : lang === 'zh-TW' 
    ? (row.title_zh_tw || row.title_en)
    : row.title_en;

  const summary = lang === 'zh-CN'
    ? (row.summary_zh_cn || row.summary_en)
    : lang === 'zh-TW'
    ? (row.summary_zh_tw || row.summary_en)
    : row.summary_en;

  const body = lang === 'zh-CN'
    ? (row.body_html_zh_cn || row.body_html_en)
    : lang === 'zh-TW'
    ? (row.body_html_zh_tw || row.body_html_en)
    : row.body_html_en;

  return { title, summary, body };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Language');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
